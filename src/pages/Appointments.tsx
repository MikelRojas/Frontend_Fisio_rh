// src/pages/Appointments.tsx
import React, { useEffect, useMemo, useState } from "react"
import CustomButton from "../components/Buttom"
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

type FilterKey = "all" | "requested" | "unpaid" | "paid"

const Appointments: React.FC = () => {
  const user = useMemo(() => getCachedUser(), [])
  const isLoggedIn = !!user
  const isAdmin = user?.role === "admin"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const [isOpen, setIsOpen] = useState(false) // modal crear cita
  const [form, setForm] = useState<CreateAppointmentPayload>({
    description: "",
    date: "",
    time: "",
    durationMin: 60,
    comment: "",
    considerations: "",
  })

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Modal detalle (admin edita / user solo ve y borra)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [draft, setDraft] = useState<Appointment | null>(null)

  // ✅ NUEVO: filtros
  const [filter, setFilter] = useState<FilterKey>("all")

  const openDetail = (appt: Appointment) => {
    setSelectedAppt(appt)
    setIsDetailOpen(true)
  }
  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedAppt(null)
    setDraft(null)
  }

  useEffect(() => {
    if (isDetailOpen && selectedAppt) setDraft(selectedAppt)
  }, [isDetailOpen, selectedAppt])

  const setDraftField = (key: keyof Appointment, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const fetchAppointments = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      if (!isLoggedIn || !user) {
        setAppointments([])
        setErrorMsg("Debes iniciar sesión para ver citas.")
        return
      }

      // Backend filtra por rol usando el token:
      // - Admin: ve todo
      // - User: ve solo lo suyo
      const data = await apiFetch<Appointment[]>("/api/appointments/", { method: "GET" })
      setAppointments(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error("Error cargando citas:", e)
      setAppointments([])
      setErrorMsg(e?.message || "No se pudieron cargar las citas.")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn || !user) {
      alert("Debes iniciar sesión para crear una cita.")
      return
    }
    if (!form.description.trim() || !form.date || !form.time) {
      alert("Completa descripción, fecha y hora.")
      return
    }

    setSubmitting(true)
    try {
      const requested_start = toLocalIsoWithOffset(form.date, form.time)
      const requested_end = addMinutesWithOffset(requested_start, form.durationMin)

      // No mandamos user_id: el backend lo toma del token
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

      await fetchAppointments()
      resetForm()
      closeModal()
    } catch (err: any) {
      console.error("Error creando cita:", err)
      alert(err?.message || "No se pudo crear la cita.")
    } finally {
      setSubmitting(false)
    }
  }

  // ===== Acciones Admin / User en modal detalle =====

  // ✅ Admin: confirmar (verde)
  const confirmAppointment = async () => {
    if (!draft) return

    if (!draft.scheduled_start || !draft.scheduled_end) {
      alert("Debes definir Scheduled start y Scheduled end para confirmar.")
      return
    }

    try {
      await apiFetch(`/api/appointments/${draft.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          scheduled_start: draft.scheduled_start,
          scheduled_end: draft.scheduled_end,
        }),
      })

      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      alert(e?.message || "No se pudo confirmar la cita.")
    }
  }

  // ✅ Admin: denegar (rojo)
  const denyAppointment = async () => {
    if (!draft) return
    const ok = confirm("¿Seguro que deseas denegar esta cita?")
    if (!ok) return

    try {
      await apiFetch(`/api/appointments/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "denied",
        }),
      })

      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      alert(e?.message || "No se pudo denegar la cita.")
    }
  }

  // ✅ User: borrar
  const deleteAppointment = async () => {
    if (!selectedAppt) return
    const ok = confirm("¿Seguro que deseas borrar esta cita?")
    if (!ok) return

    try {
      await apiFetch(`/api/appointments/${selectedAppt.id}`, { method: "DELETE" })
      await fetchAppointments()
      closeDetail()
    } catch (e: any) {
      alert(e?.message || "No se pudo borrar la cita.")
    }
  }

  // ✅ Aplicar filtros en frontend
  const filteredAppointments = useMemo(() => {
    const list = Array.isArray(appointments) ? appointments : []

    switch (filter) {
      case "requested":
        return list.filter((a) => (a.status || "").toLowerCase() === "requested")
      case "paid":
        return list.filter((a) => !!a.is_paid)
      case "unpaid":
        // “Pendiente de pago”: tiene cita confirmada pero no pagada (ajusta si quieres otra lógica)
        return list.filter(
          (a) => (a.status || "").toLowerCase() === "confirmed" && !a.is_paid
        )
      case "all":
      default:
        return list
    }
  }, [appointments, filter])

  const setFilterCheckbox = (next: FilterKey) => {
    // checkboxes pero “solo uno a la vez”
    setFilter(next)
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <section className="mx-auto max-w-[1280px] px-6 py-12 grid grid-cols-1 md:grid-cols-[1fr_1px_3fr] gap-8">
        {/* LEFT */}
        <div className="space-y-6">
          {/* BLOQUE 1: Nueva cita */}
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
              onClick={() => setIsOpen(true)}
              disabled={!isLoggedIn}
            >
              + Crear cita
            </CustomButton>
          </div>

          {/* BLOQUE 2: Filtros */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-3">Filtros</h3>

            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input
                type="checkbox"
                checked={filter === "all"}
                onChange={() => setFilterCheckbox("all")}
              />
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
              <input
                type="checkbox"
                checked={filter === "unpaid"}
                onChange={() => setFilterCheckbox("unpaid")}
              />
              Citas Pendientes de Pago
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filter === "paid"}
                onChange={() => setFilterCheckbox("paid")}
              />
              Citas Pagadas
            </label>
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
            {isLoggedIn
              ? isAdmin
                ? "Viendo todas las citas (Admin)."
                : "Viendo tus citas."
              : "Inicia sesión para ver tus citas."}
          </p>

          {errorMsg && (
            <div className="mb-5 bg-white rounded-xl shadow-md p-4 text-sm text-red-600">{errorMsg}</div>
          )}

          {loading && (
            <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">Cargando citas...</div>
          )}

          {!loading && isLoggedIn && filteredAppointments.length === 0 && !errorMsg && (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-600">
              No hay citas
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition relative"
              >
                {/* Detalle para todos: admin edita, user solo ve */}
                <button
                  type="button"
                  onClick={() => openDetail(appt)}
                  className="absolute top-3 right-3 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                  title={isAdmin ? "Ver/editar" : "Ver"}
                  aria-label={isAdmin ? "Ver/editar" : "Ver"}
                >
                  {isAdmin ? "✏️" : "👁️"}
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

        {/* MODAL: Crear cita */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
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

                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descripción"
                  className="w-full rounded-xl border px-3 py-2"
                />

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2"
                />

                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2"
                />

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

                <input
                  name="considerations"
                  value={form.considerations ?? ""}
                  onChange={handleChange}
                  placeholder="Consideraciones (opcional)"
                  className="w-full rounded-xl border px-3 py-2"
                />

                <textarea
                  name="comment"
                  value={form.comment ?? ""}
                  onChange={handleChange}
                  placeholder="Comentario (opcional)"
                  className="w-full rounded-xl border px-3 py-2"
                  rows={3}
                />

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

        {/* MODAL: Detalle (Admin: 2 botones / User: borrar) */}
        {isDetailOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
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
                {isAdmin ? "Admin: puedes confirmar o denegar." : "Vista de la información."}
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
                    <p className="font-semibold text-slate-900">
                      {selectedAppt.is_paid ? "Pagado" : "Pendiente"}
                    </p>
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

                {/* Scheduled editable para admin (necesario para confirmar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Scheduled start</p>
                    {isAdmin ? (
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 font-mono"
                        placeholder="YYYY-MM-DDTHH:mm:ss-06:00"
                        value={draft?.scheduled_start ?? ""}
                        onChange={(e) => setDraftField("scheduled_start", e.target.value)}
                      />
                    ) : (
                      <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_start)}</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-slate-500">Scheduled end</p>
                    {isAdmin ? (
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 font-mono"
                        placeholder="YYYY-MM-DDTHH:mm:ss-06:00"
                        value={draft?.scheduled_end ?? ""}
                        onChange={(e) => setDraftField("scheduled_end", e.target.value)}
                      />
                    ) : (
                      <p className="font-mono text-slate-900">{formatDT(selectedAppt.scheduled_end)}</p>
                    )}
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

              <div className="mt-6 flex justify-end gap-3">
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
                    {/* 🔴 Denegar (rojo) */}
                    <button
                      type="button"
                      onClick={denyAppointment}
                      className="rounded-xl px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                    >
                      Denegar cita
                    </button>

                    {/* 🟢 Confirmar (verde) */}
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
