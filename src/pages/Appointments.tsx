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

const Appointments: React.FC = () => {
  const user = useMemo(() => getCachedUser(), [])
  const isLoggedIn = !!user
  const isAdmin = user?.role === "admin"

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const [isOpen, setIsOpen] = useState(false) // modal crear cita (ya lo tenías)
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

  // ✅ NUEVO: modal detalle/editar para admin
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  const openDetail = (appt: Appointment) => {
    setSelectedAppt(appt)
    setIsDetailOpen(true)
  }
  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedAppt(null)
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

      const url = isAdmin
        ? "/api/appointments/" // ✅ admin ve todo
        : `/api/appointments/?user_id=${encodeURIComponent(user.id)}` // ✅ user ve las suyas

      const data = await apiFetch<Appointment[]>(url, { method: "GET" })
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

  // Cerrar modal detalle con ESC
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
    if (!user.id) {
      alert("No se pudo identificar tu usuario (id). Vuelve a iniciar sesión.")
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

      const payload = {
        user_id: user.id,
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

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <section className="mx-auto max-w-[1280px] px-6 py-12 grid grid-cols-1 md:grid-cols-[1fr_1px_3fr] gap-8">
        {/* LEFT */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">Nueva cita</h2>
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

          {errorMsg && (
            <div className="mb-5 bg-white rounded-xl shadow-md p-4 text-sm text-red-600">{errorMsg}</div>
          )}

          {loading && (
            <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">Cargando citas...</div>
          )}

          {/* ✅ pedido: si no hay citas -> texto "No hay citas" */}
          {!loading && isLoggedIn && appointments.length === 0 && !errorMsg && (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-600">No hay citas</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition relative"
              >
                {/* ✅ Lapiz editar SOLO admin */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openDetail(appt)}
                    className="absolute top-3 right-3 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                    title="Ver/editar"
                    aria-label="Ver/editar"
                  >
                    ✏️
                  </button>
                )}

                {/* ✅ En admin: nombre real del usuario que creó la cita */}
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

        {/* MODAL: Crear cita (ya lo tenías) */}
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

        {/* ✅ MODAL: Detalle/editar (Admin) */}
        {isDetailOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />

            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              {/* X arriba derecha */}
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
              <p className="text-sm text-slate-500 mb-5">Vista rápida de la información (Admin).</p>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Paciente</p>
                  <p className="font-semibold text-slate-900">
                    {selectedAppt.user?.full_name ?? "Paciente"}
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

              <div className="mt-6 flex justify-end gap-3">
                <CustomButton variant="ghost" type="button" onClick={closeDetail}>
                  Cerrar
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Appointments
