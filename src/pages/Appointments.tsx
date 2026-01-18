// src/pages/Appointments.tsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import CustomButton from "../components/Buttom"
import CustomAlert from "@/components/Alert"
import { apiFetch } from "../lib/api"
import { getCachedUser } from "../lib/auth"

interface Appointment {
  id: string
  user_id: string
  description: string
  status: string
  scheduled_start?: string | null
  scheduled_end?: string | null
  requested_start?: string | null
  requested_end?: string | null
  is_paid: boolean
  paid_at?: string | null
  comment?: string | null
  considerations?: string | null
  user?: { full_name: string } | null
}

type CreateAppointmentPayload = {
  description: string
  date: string
  time: string
  durationMin: number
  comment?: string
  considerations?: string
}

// Costa Rica UTC-6
function toLocalIsoWithOffset(date: string, time: string) {
  return `${date}T${time}:00-06:00`
}
function addMinutesWithOffset(iso: string, minutes: number) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:00-06:00`
}

function formatDT(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

type FilterKey = "all" | "requested" | "unpaid" | "paid" | "cancelled"

const Appointments: React.FC = () => {
  const navigate = useNavigate()

  const user = useMemo(() => getCachedUser(), [])
  const isLoggedIn = !!user
  const isAdmin = user?.role === "admin"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Modal crear cita (solo user)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<CreateAppointmentPayload>({
    description: "",
    date: "",
    time: "",
    durationMin: 60,
    comment: "",
    considerations: "",
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal detalle (admin/user)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  // UI alerts
  const [uiAlert, setUiAlert] = useState<{
    type: "success" | "error" | "warning" | "info"
    title: string
    description?: string
  } | null>(null)

  // ✅ Switch pago (solo admin)
  const [paidSwitch, setPaidSwitch] = useState(false)
  const [updatingPaid, setUpdatingPaid] = useState(false)

  // filtros
  const [filter, setFilter] = useState<FilterKey>("all")
  const [filterDate, setFilterDate] = useState("") // YYYY-MM-DD
  const [searchName, setSearchName] = useState("") // admin: buscar paciente

  const openDetail = (appt: Appointment) => {
    setUiAlert(null)
    setSelectedAppt(appt)
    setPaidSwitch(!!appt.is_paid)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedAppt(null)
    setUpdatingPaid(false)
  }

  const closeModal = () => setIsOpen(false)

  const resetForm = () => {
    setForm({
      description: "",
      date: "",
      time: "",
      durationMin: 60,
      comment: "",
      considerations: "",
    })
  }

  const fetchAppointments = async () => {
    setLoading(true)
    setUiAlert(null)

    try {
      if (!isLoggedIn || !user) {
        setAppointments([])
        setUiAlert({
          type: "warning",
          title: "Inicia sesión",
          description: "Debes iniciar sesión para ver tus citas.",
        })
        return
      }

      const data = await apiFetch<Appointment[]>("/api/appointments/", { method: "GET" })
      setAppointments(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error("Error cargando citas:", e)
      setAppointments([])
      setUiAlert({
        type: "error",
        title: "No se pudieron cargar las citas",
        description: e?.message || "Error inesperado.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar modales con ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        closeDetail()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "durationMin" ? Number(value) : value,
    }))
  }

  // User: crear cita
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiAlert(null)

    if (!isLoggedIn || !user) {
      setUiAlert({
        type: "warning",
        title: "Debes iniciar sesión",
        description: "Inicia sesión para crear una cita.",
      })
      return
    }

    if (!form.description.trim()) {
      setUiAlert({ type: "warning", title: "Descripción requerida" })
      return
    }
    if (!form.date) {
      setUiAlert({ type: "warning", title: "Fecha requerida" })
      return
    }
    if (!form.time) {
      setUiAlert({ type: "warning", title: "Hora requerida" })
      return
    }

    setSubmitting(true)
    try {
      const requested_start = toLocalIsoWithOffset(form.date, form.time)
      const requested_end = addMinutesWithOffset(requested_start, form.durationMin)

      const payload = {
        description: form.description.trim(),
        comment: form.comment?.trim() ? form.comment.trim() : null,
        considerations: form.considerations?.trim() ? form.considerations.trim() : null,
        requested_start,
        requested_end,
      }

      await apiFetch("/api/appointments/", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setUiAlert({
        type: "success",
        title: "Cita solicitada",
        description: "Tu solicitud fue enviada. Te avisaremos cuando sea confirmada.",
      })

      await fetchAppointments()
      resetForm()
      closeModal()
    } catch (err: any) {
      console.error("Error creando cita:", err)
      setUiAlert({
        type: "error",
        title: "No se pudo crear la cita",
        description: err?.message || "Error inesperado.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ===== Acciones Admin en modal detalle (solo info + pago + confirm/cancel + editar en agenda) =====

  // Admin: confirmar (solo si ya tiene scheduled_start)
  const confirmAppointment = async () => {
    if (!selectedAppt) return
    setUiAlert(null)

    if (!selectedAppt.scheduled_start) {
      setUiAlert({
        type: "warning",
        title: "No hay horario asignado",
        description: "Para confirmar, primero asigna el horario desde la Agenda.",
      })
      return
    }

    try {
      await apiFetch(`/api/appointments/${selectedAppt.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          scheduled_start: selectedAppt.scheduled_start,
        }),
      })

      setUiAlert({
        type: "success",
        title: "Cita confirmada",
        description: "La cita fue confirmada correctamente.",
      })

      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      setUiAlert({
        type: "error",
        title: "No se pudo confirmar la cita",
        description: e?.message || "Error inesperado.",
      })
    }
  }

  // Admin: cancelar
  const cancelAppointment = async () => {
    if (!selectedAppt) return
    setUiAlert(null)

    const ok = confirm("¿Seguro que deseas cancelar esta cita?")
    if (!ok) return

    const reasonInput = prompt("Motivo de cancelación (opcional):")
    const reason = reasonInput?.trim() ? reasonInput.trim() : undefined

    try {
      await apiFetch(`/api/appointments/${selectedAppt.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })

      setUiAlert({
        type: "success",
        title: "Cita cancelada",
        description: "La cita fue cancelada correctamente.",
      })

      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      setUiAlert({
        type: "error",
        title: "No se pudo cancelar la cita",
        description: e?.message || "Error inesperado.",
      })
    }
  }

  // Admin: toggle pago vía /set-paid (switch)
  const togglePaid = async (nextPaid: boolean) => {
    if (!selectedAppt) return
    setUiAlert(null)

    const statusLower = (selectedAppt.status || "").toLowerCase()
    if (statusLower === "cancelled") {
      setUiAlert({
        type: "warning",
        title: "Acción no permitida",
        description: "No se puede editar el pago de una cita cancelada.",
      })
      return
    }

    const ok = confirm(nextPaid ? "¿Marcar como PAGADA?" : "¿Marcar como NO pagada?")
    if (!ok) return

    const notePrompt = nextPaid ? "Nota de pago (opcional):" : "Motivo para quitar pago (opcional):"
    const noteInput = prompt(notePrompt)
    const note = noteInput?.trim() ? noteInput.trim() : undefined

    // Optimistic UI + rollback
    const prev = paidSwitch
    setPaidSwitch(nextPaid)
    setUpdatingPaid(true)

    try {
      await apiFetch(`/api/appointments/${selectedAppt.id}/set-paid`, {
        method: "POST",
        body: JSON.stringify({ is_paid: nextPaid, note }),
      })

      setUiAlert({
        type: "success",
        title: "Pago actualizado",
        description: nextPaid ? "Marcada como pagada." : "Marcada como no pagada.",
      })

      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      console.error("Error actualizando pago:", e)
      setPaidSwitch(prev)
      setUiAlert({
        type: "error",
        title: "No se pudo actualizar el pago",
        description: e?.message || "Error inesperado.",
      })
    } finally {
      setUpdatingPaid(false)
    }
  }

  // User: borrar
  const deleteAppointment = async () => {
    if (!selectedAppt) return
    setUiAlert(null)

    const ok = confirm("¿Seguro que deseas borrar esta cita?")
    if (!ok) return

    try {
      await apiFetch(`/api/appointments/${selectedAppt.id}`, { method: "DELETE" })
      setUiAlert({
        type: "success",
        title: "Cita eliminada",
        description: "La cita fue eliminada correctamente.",
      })
      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      setUiAlert({
        type: "error",
        title: "No se pudo borrar la cita",
        description: e?.message || "Error inesperado.",
      })
    }
  }

  const setFilterCheckbox = (next: FilterKey) => setFilter(next)

  // Filtros aplicados
  const filteredAppointments = useMemo(() => {
    let list = Array.isArray(appointments) ? appointments : []

    // estado/pago
    switch (filter) {
      case "requested":
        list = list.filter((a) => (a.status || "").toLowerCase() === "requested")
        break
      case "paid":
        list = list.filter((a) => !!a.is_paid)
        break
      case "unpaid":
        list = list.filter((a) => (a.status || "").toLowerCase() === "confirmed" && !a.is_paid)
        break
      case "cancelled":
        list = list.filter((a) => (a.status || "").toLowerCase() === "cancelled")
        break
      default:
        break
    }

    // fecha (scheduled_start si existe, si no requested_start)
    if (filterDate) {
      list = list.filter((a) => {
        const base = a.scheduled_start || a.requested_start
        if (!base) return false
        const d = new Date(base)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${y}-${m}-${day}` === filterDate
      })
    }

    // búsqueda por nombre (solo admin)
    if (isAdmin && searchName.trim()) {
      const q = searchName.trim().toLowerCase()
      list = list.filter((a) => (a.user?.full_name || "").toLowerCase().includes(q))
    }

    return list
  }, [appointments, filter, filterDate, isAdmin, searchName])

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <section className="mx-auto max-w-[1280px] px-6 py-12 grid grid-cols-1 md:grid-cols-[1fr_1px_3fr] gap-8">
        {/* LEFT */}
        <div className="space-y-6">
          {/* ALERT GLOBAL */}
          {uiAlert && (
            <CustomAlert
              type={uiAlert.type}
              title={uiAlert.title}
              description={uiAlert.description}
              onClose={() => setUiAlert(null)}
            />
          )}

          {/* BLOQUE 1: Nueva cita (solo USER) */}
          {!isAdmin && (
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1">Nueva cita</h2>
              <p className="text-sm text-gray-600 mb-4">Agenda una nueva cita de forma rápida y sencilla.</p>

              {!isLoggedIn && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Debes <span className="font-semibold">iniciar sesión</span> para crear citas.
                </div>
              )}

              <CustomButton
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setUiAlert(null)
                  setIsOpen(true)
                }}
                disabled={!isLoggedIn}
              >
                + Crear cita
              </CustomButton>
            </div>
          )}

          {/* BLOQUE 2: Filtros */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-3">Filtros</h3>

            <div className="space-y-2 mb-4">
              <label className="text-sm font-semibold text-slate-800">Filtrar por fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>

            {isAdmin && (
              <div className="space-y-2 mb-4">
                <label className="text-sm font-semibold text-slate-800">Buscar por paciente</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ej: Andrea"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input type="checkbox" checked={filter === "all"} onChange={() => setFilterCheckbox("all")} />
              Todas las Citas
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input
                type="checkbox"
                checked={filter === "requested"}
                onChange={() => setFilterCheckbox("requested")}
              />
              Citas Solicitadas
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input type="checkbox" checked={filter === "unpaid"} onChange={() => setFilterCheckbox("unpaid")} />
              Citas Pendientes de Pago
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input type="checkbox" checked={filter === "paid"} onChange={() => setFilterCheckbox("paid")} />
              Citas Pagadas
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filter === "cancelled"}
                onChange={() => setFilterCheckbox("cancelled")}
              />
              Citas Canceladas
            </label>

            {(filterDate || (isAdmin && searchName.trim())) && (
              <div className="mt-4 flex gap-2">
                <CustomButton
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilterDate("")
                    setSearchName("")
                  }}
                >
                  Limpiar filtros
                </CustomButton>
              </div>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden md:flex justify-center">
          <div className="w-px h-[70%] bg-gray-300/60 rounded-full self-center" />
        </div>

        {/* RIGHT */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Citas programadas</h1>

          <p className="text-sm text-gray-600 mb-6">
            {isLoggedIn ? (isAdmin ? "Viendo todas las citas (Admin)." : "Viendo tus citas.") : "Inicia sesión para ver tus citas."}
          </p>

          {loading && <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">Cargando citas...</div>}

          {!loading && isLoggedIn && filteredAppointments.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-600">No hay citas</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition relative">
                <button
                  type="button"
                  onClick={() => openDetail(appt)}
                  className="absolute top-3 right-3 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                  title="Ver detalle"
                  aria-label="Ver detalle"
                >
                  👁️
                </button>

                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {isAdmin ? appt.user?.full_name ?? "Paciente" : user?.full_name ?? "Paciente"}
                </h3>

                <p className="text-sm text-gray-600 mb-2">{appt.description}</p>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {appt.scheduled_start
                      ? new Date(appt.scheduled_start).toLocaleString()
                      : appt.requested_start
                      ? new Date(appt.requested_start).toLocaleString()
                      : "Pendiente"}
                  </p>
                  <p>
                    <span className="font-semibold">Estado:</span> {appt.status}
                  </p>
                  <p>
                    <span className="font-semibold">Pago:</span> {appt.is_paid ? "Pagado" : "Pendiente"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL: Crear cita (solo USER) */}
        {!isAdmin && isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Crear cita</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Paciente</label>
                  <input
                    value={user?.full_name ?? ""}
                    disabled
                    className="w-full rounded-xl border bg-slate-100 px-3 py-2 text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Descripción <span className="text-red-600">*</span>
                  </label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Descripción"
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Fecha <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Hora <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Duración</label>
                  <select
                    name="durationMin"
                    value={form.durationMin}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Consideraciones (opcional)</label>
                  <input
                    name="considerations"
                    value={form.considerations ?? ""}
                    onChange={handleChange}
                    placeholder="Consideraciones"
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Comentario (opcional)</label>
                  <textarea
                    name="comment"
                    value={form.comment ?? ""}
                    onChange={handleChange}
                    placeholder="Comentario"
                    className="w-full rounded-xl border px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <CustomButton variant="ghost" type="button" onClick={closeModal}>
                    Cancelar
                  </CustomButton>
                  <CustomButton variant="primary" type="submit" disabled={submitting}>
                    {submitting ? "Guardando..." : "Guardar cita"}
                  </CustomButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Detalle (Admin/User) */}
        {isDetailOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
              <button
                type="button"
                onClick={closeDetail}
                className="absolute right-4 top-4 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold text-slate-900 mb-1">Detalle de cita</h2>
              <p className="text-sm text-slate-500 mb-5">
                {isAdmin
                  ? "Admin: aquí solo ves información, pago y confirmación/cancelación. Para editar horario, usa Agenda."
                  : "Vista de la información."}
              </p>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Paciente</p>
                  <p className="font-semibold text-slate-900">
                    {selectedAppt.user?.full_name ?? user?.full_name ?? "Paciente"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Descripción</p>
                  <p className="font-semibold text-slate-900">{selectedAppt.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Estado</p>
                    <p className="font-semibold text-slate-900">{selectedAppt.status}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Pago</p>

                    {isAdmin ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{paidSwitch ? "Pagado" : "Pendiente"}</p>
                          <p className="text-xs text-slate-500">
                            {selectedAppt.paid_at ? `Pagado el: ${formatDT(selectedAppt.paid_at)}` : "—"}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={updatingPaid || (selectedAppt.status || "").toLowerCase() === "cancelled"}
                          onClick={() => togglePaid(!paidSwitch)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                            paidSwitch ? "bg-green-600" : "bg-slate-300"
                          } ${
                            updatingPaid || (selectedAppt.status || "").toLowerCase() === "cancelled"
                              ? "opacity-60 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          aria-pressed={paidSwitch}
                          aria-label="Cambiar estado de pago"
                          title={
                            (selectedAppt.status || "").toLowerCase() === "cancelled"
                              ? "No se puede editar el pago de una cita cancelada"
                              : "Cambiar estado de pago"
                          }
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                              paidSwitch ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ) : (
                      <p className="font-semibold text-slate-900">{selectedAppt.is_paid ? "Pagado" : "Pendiente"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Requested start</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.requested_start)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Requested end</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.requested_end)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Scheduled start</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_start)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Scheduled end</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_end)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Consideraciones</p>
                  <p className="text-slate-900">{selectedAppt.considerations || "—"}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Comentario</p>
                  <p className="text-slate-900">{selectedAppt.comment || "—"}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <CustomButton variant="ghost" type="button" onClick={closeDetail}>
                  Cerrar
                </CustomButton>

                {!isAdmin && (
                  <CustomButton variant="primary" type="button" onClick={deleteAppointment}>
                    Borrar cita
                  </CustomButton>
                )}

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const base = selectedAppt.scheduled_start || selectedAppt.requested_start
                        const d = base ? new Date(base) : new Date()
                        const yyyy = d.getFullYear()
                        const mm = String(d.getMonth() + 1).padStart(2, "0")
                        const dd = String(d.getDate()).padStart(2, "0")
                        const day = `${yyyy}-${mm}-${dd}`

                        // Opcional: podrías agregar appointmentId si luego el Planner lo usa para abrir directo
                        // navigate(`/planner?day=${day}&appointmentId=${selectedAppt.id}`)
                        navigate(`/planner?day=${day}`)
                        closeDetail()
                      }}
                      className="rounded-xl px-4 py-2 font-semibold text-white bg-slate-800 hover:bg-slate-900 transition"
                    >
                      Editar en agenda
                    </button>

                    <button
                      type="button"
                      onClick={cancelAppointment}
                      className="rounded-xl px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                    >
                      Cancelar cita
                    </button>

                    <button
                      type="button"
                      onClick={confirmAppointment}
                      className="rounded-xl px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-700 transition"
                    >
                      Confirmar cita
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Appointments