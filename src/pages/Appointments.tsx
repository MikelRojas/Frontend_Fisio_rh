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
  user?: { full_name: string; phone?: string | null } | null

  proposals?: {
    id: string
    start_at: string
    end_at: string
    rank: number
    is_selected: boolean
  }[]
}


type CreateAppointmentPayload = {
  description: string
  comment?: string
  considerations?: string
  proposed_starts: string[] // 3 ISO strings
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
  const statusColors = {
    requested: "bg-amber-100 text-amber-700",
    confirmed: "bg-teal-100 text-teal-700",
    cancelled: "bg-rose-100 text-rose-700",
  }

  const user = useMemo(() => getCachedUser(), [])
  const isLoggedIn = !!user
  const isAdmin = user?.role === "admin"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Modal crear cita (solo user)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<CreateAppointmentPayload>({
    description: "",
    comment: "",
    considerations: "",
    proposed_starts: [],
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
  const [confirmingProposalId, setConfirmingProposalId] = useState<string | null>(null)


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
      comment: "",
      considerations: "",
      proposed_starts: [],
    })
  }

  const [weekFrom, setWeekFrom] = useState("") 
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  async function fetchAvailability(fromDate: string) {
    setLoadingSlots(true)
    try {
      // semana: from 00:00 a +7 días
      const fromIso = `${fromDate}T00:00:00-06:00`
      const to = new Date(fromIso)
      to.setDate(to.getDate() + 7)
      const toIso = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(
        to.getDate()
      ).padStart(2, "0")}T00:00:00-06:00`
  
      const res = await apiFetch<{ slots: string[] }>("/api/appointments/availability?from=" + encodeURIComponent(fromIso) + "&to=" + encodeURIComponent(toIso), {
        method: "GET",
      })
      setAvailableSlots(Array.isArray(res?.slots) ? res.slots : [])
    } catch (e: any) {
      setAvailableSlots([])
      setUiAlert({
        type: "error",
        title: "No se pudo cargar disponibilidad",
        description: e?.message ?? "Error inesperado",
      })
    } finally {
      setLoadingSlots(false)
    }
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
  }, [])

  useEffect(() => {
    if (!isOpen) return
    if (!weekFrom) return
    fetchAvailability(weekFrom)
  }, [isOpen, weekFrom])
  

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
    setForm((prev) => ({ ...prev, [name]: value }))
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
    if (form.proposed_starts.length !== 3) {
      setUiAlert({ type: "warning", title: "Debes seleccionar 3 opciones" })
      return
    }    

    setSubmitting(true)
    try {
      const payload = {
        description: form.description.trim(),
        comment: form.comment?.trim() ? form.comment.trim() : null,
        considerations: form.considerations?.trim() ? form.considerations.trim() : null,
        proposed_starts: form.proposed_starts,
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
        const base =
          a.scheduled_start ||
          a.requested_start ||
          a.proposals?.[0]?.start_at ||
          null
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
    <section className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-[280px_1px_1fr] gap-10">
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
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 sticky top-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Nueva cita</h2>
              <p className="text-sm text-slate-600 mb-4">Agenda una nueva cita de forma rápida y sencilla.</p>

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
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-3">Filtros</h3>

            <div className="space-y-2 mb-4">
              <label className="text-sm font-semibold text-slate-800">Filtrar por fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 px-3 py-2 outline-none transition"
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
                  className="w-full rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 px-3 py-2 outline-none transition"
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
          <div className="w-px h-[70%] bg-slate-200 rounded-full self-center" />
        </div>

        {/* RIGHT */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Citas programadas</h1>

          <p className="text-sm text-slate-600 mb-6">
            {isLoggedIn ? (isAdmin ? "Viendo todas las citas (Admin)." : "Viendo tus citas.") : "Inicia sesión para ver tus citas."}
          </p>

          {loading && <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 text-slate-600">Cargando citas...</div>}

          {!loading && isLoggedIn && filteredAppointments.length === 0 && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-10 text-center text-slate-600">No hay citas</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appt) => (
              <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all duration-200 relative">
                <button
                  type="button"
                  onClick={() => openDetail(appt)}
                  className="absolute top-3 right-3 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                  title="Ver detalle"
                  aria-label="Ver detalle"
                >
                  📝
                </button>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isAdmin ? appt.user?.full_name ?? "Paciente" : user?.full_name ?? "Paciente"}
                </h3>

                {isAdmin && (
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[(appt.status || "").toLowerCase() as keyof typeof statusColors] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {appt.status}
                  </span>
                )}


                <p className="text-sm text-slate-600 mb-2">{appt.description}</p>

                <div className="text-sm text-slate-700 space-y-1">
                  - 
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {(appt.status || "").toLowerCase() === "requested" ? (
                      <span className="text-slate-500">
                        Pendiente{" "}
                        {appt.proposals?.length ? `(${appt.proposals.length} opciones propuestas)` : ""}
                      </span>
                    ) : appt.scheduled_start ? (
                      new Date(appt.scheduled_start).toLocaleString()
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white border border-slate-200 shadow-sm p-6 shadow-xl max-h-[85vh] overflow-y-auto">
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
                    className="w-full rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 px-3 py-2 outline-none transition"
                  />
                </div>

                {/* Semana a consultar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold">Semana (lunes recomendado)</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 bg-white border border-slate-200 shadow-sm"
                      value={weekFrom}
                      onChange={(e) => setWeekFrom(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mostraremos solo espacios disponibles (L-V 1pm–7pm).
                    </p>
                  </div>

                  <div className="flex items-end">
                    <CustomButton
                      variant="secondary"
                      onClick={() => weekFrom && fetchAvailability(weekFrom)}
                      disabled={!weekFrom || loadingSlots}
                    >
                      {loadingSlots ? "Cargando..." : "Ver disponibilidad"}
                    </CustomButton>
                  </div>
                </div>

                {/* Slots disponibles */}
                <div className="rounded-xl border bg-white border border-slate-200 shadow-sm/70 p-3">
                  <p className="font-semibold mb-2">Elegí 3 opciones</p>

                  {form.proposed_starts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.proposed_starts.map((iso) => (
                        <span
                          key={iso}
                          className="text-xs px-2 py-1 rounded-full bg-[#2f8f90]/10 text-[#1f6c6d] border border-[#2f8f90]/20"
                        >
                          {new Date(iso).toLocaleString()}
                          <button
                            type="button"
                            className="ml-2 opacity-70 hover:opacity-100"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                proposed_starts: prev.proposed_starts.filter((x) => x !== iso),
                              }))
                            }
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {!weekFrom ? (
                    <p className="text-sm text-muted-foreground">
                      Seleccioná una semana para ver espacios disponibles.
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {loadingSlots ? "Cargando..." : "No hay espacios disponibles en esta semana."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {availableSlots.map((iso) => {
                        const selected = form.proposed_starts.includes(iso)
                        const disabled = !selected && form.proposed_starts.length >= 3
                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              const withTimezone = new Date(iso).toISOString() // 👈 CLAVE
                            
                              setForm((prev) => {
                                if (prev.proposed_starts.includes(withTimezone)) return prev
                                return { ...prev, proposed_starts: [...prev.proposed_starts, withTimezone] }
                              })
                            }}
                            className={[
                              "rounded-lg border px-3 py-2 text-left text-sm bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition",
                              selected ? "border-[#2f8f90] bg-[#2f8f90]/10" : "",
                              disabled ? "opacity-50 cursor-not-allowed" : "",
                            ].join(" ")}
                          >
                            {new Date(iso).toLocaleString()}
                            <div className="text-xs text-muted-foreground">Duración: 1 hora</div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Debés elegir exactamente 3 opciones.
                  </p>
                </div>


                <div>
                  <label className="text-sm font-medium text-slate-700">Describe tu caso</label>
                  <input
                    name="considerations"
                    value={form.considerations ?? ""}
                    onChange={handleChange}
                    placeholder="Consideraciones"
                    className="w-full rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 px-3 py-2 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">¿Alguna condición o consideración adicional? (Opcional)</label>
                  <textarea
                    name="comment"
                    value={form.comment ?? ""}
                    onChange={handleChange}
                    placeholder="Comentario"
                    className="w-full rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 px-3 py-2 outline-none transition"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <CustomButton variant="ghost" type="button" onClick={closeModal}>
                    Cancelar
                  </CustomButton>
                  <CustomButton variant="default" type="submit" disabled={submitting}>
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDetail} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white border border-slate-200 shadow-sm p-6 shadow-xl max-h-[85vh] overflow-y-auto">
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

                {isAdmin && (
                  <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Telefono</p>
                  <p className="font-semibold text-slate-900">
                  {selectedAppt.user?.phone ? selectedAppt.user.phone : "—"}
                  </p>
                </div>
                  
                )}

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
                            paidSwitch ? "bg-teal-600" : "bg-slate-300"
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
                            className={`inline-block h-5 w-5 transform rounded-full bg-white border border-slate-200 shadow-sm transition ${
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
                    <p className="text-slate-500">Hora de inicio</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_start)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Hora de finalización</p>
                    <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_end)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Descripcion del caso</p>
                  <p className="text-slate-900">{selectedAppt.considerations || "—"}</p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Comentario adicional</p>
                  <p className="text-slate-900">{selectedAppt.comment || "—"}</p>
                </div>
              </div>

              {isAdmin && selectedAppt?.status === "requested" && (
              <div className="rounded-xl border bg-white border border-slate-200 shadow-sm/70 p-3">
                <p className="font-semibold mb-2">Opciones propuestas por el paciente</p>

                {(!selectedAppt.proposals || selectedAppt.proposals.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No hay opciones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedAppt.proposals.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 border rounded-lg p-2 bg-white border border-slate-200 shadow-sm">
                        <div className="text-sm">
                          <div className="font-medium">Opción {p.rank}</div>
                          <div className="text-muted-foreground">{new Date(p.start_at).toLocaleString()}</div>
                        </div>

                        <CustomButton
                          variant="secondary"
                          type="button"
                          loading={confirmingProposalId === p.id}
                          disabled={!!confirmingProposalId} // bloquea todos mientras confirma
                          className="shadow-sm hover transition"
                          onClick={async () => {
                            try {
                              setConfirmingProposalId(p.id)

                              await apiFetch(`/api/appointments/${selectedAppt.id}/confirm`, {
                                method: "POST",
                                body: JSON.stringify({ proposal_id: p.id }),
                              })

                              setUiAlert({ type: "success", title: "Cita confirmada" })
                              await fetchAppointments()
                              closeDetail()
                            } catch (e: any) {
                              setUiAlert({ type: "error", title: "No se pudo confirmar", description: e?.message })
                            } finally {
                              setConfirmingProposalId(null)
                            }
                          }}
                        >
                          Confirmar esta
                        </CustomButton>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <CustomButton variant="ghost" type="button" onClick={closeDetail}>
                  Cerrar
                </CustomButton>

                {!isAdmin && (
                  <CustomButton variant="default" type="button" onClick={deleteAppointment}>
                    Borrar cita
                  </CustomButton>
                )}

              {isAdmin && (
                <>
                  {/* Editar en agenda */}
                  <CustomButton
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      const base = selectedAppt.scheduled_start || selectedAppt.requested_start
                      const d = base ? new Date(base) : new Date()
                      const yyyy = d.getFullYear()
                      const mm = String(d.getMonth() + 1).padStart(2, "0")
                      const dd = String(d.getDate()).padStart(2, "0")
                      const day = `${yyyy}-${mm}-${dd}`

                      navigate(`/planner?day=${day}`)
                      closeDetail()
                    }}
                  >
                    Editar en agenda
                  </CustomButton>

                  {/* Confirmar cita (solo si no está en requested) */}
                  {(selectedAppt.status || "").toLowerCase() !== "requested" && (
                    <CustomButton
                      variant="default"
                      type="button"
                      onClick={confirmAppointment}
                    >
                      Confirmar cita
                    </CustomButton>
                  )}

                  {/* Cancelar cita */}
                  <CustomButton
                    variant="destructive"
                    type="button"
                    onClick={cancelAppointment}
                  >
                    Cancelar cita
                  </CustomButton>
                </>
              )}

              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

export default Appointments