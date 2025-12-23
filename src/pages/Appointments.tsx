import React, { useEffect, useState } from "react"
import CustomButton from "../components/Buttom"

interface Appointment {
  id: string
  description: string
  status: string
  scheduled_start?: string
  is_paid: boolean
  patient?: {
    full_name: string
  }
}

type CreateAppointmentPayload = {
  patientName: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  durationMin: number
  comment?: string
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [isOpen, setIsOpen] = useState(false)

  // Form state
  const [form, setForm] = useState<CreateAppointmentPayload>({
    patientName: "",
    description: "",
    date: "",
    time: "",
    durationMin: 60,
    comment: "",
  })

  const [submitting, setSubmitting] = useState(false)

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/appointments")
      const data = await res.json()
      setAppointments(data)
    } catch (e) {
      console.error("Error cargando citas:", e)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Cerrar modal con ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    if (isOpen) window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

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
      patientName: "",
      description: "",
      date: "",
      time: "",
      durationMin: 60,
      comment: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.patientName.trim() || !form.description.trim() || !form.date || !form.time) {
      alert("Completa paciente, descripción, fecha y hora.")
      return
    }

    setSubmitting(true)
    try {
      /**
       * ⚠️ Ajustá el endpoint según tu backend.
       * Si tu backend recibe otra estructura (patient_id, requested_start, etc.),
       * decime y lo adaptamos exacto.
       */
      const res = await fetch("http://localhost:5000/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || "No se pudo crear la cita")
      }

      // Refrescar lista
      await fetchAppointments()
      resetForm()
      closeModal()
    } catch (err) {
      console.error("Error creando cita:", err)
      alert("No se pudo crear la cita. Revisa consola / backend.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <section
        className="mx-auto max-w-[1280px] px-6 py-12
        grid grid-cols-1 md:grid-cols-[1fr_1px_3fr] gap-8"
      >
        {/* ---------------- LEFT PANEL ---------------- */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              Nueva cita
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Agenda una nueva cita para tus pacientes de forma rápida y sencilla.
            </p>

            {/* BOTÓN (el que mencionaste) */}
            <CustomButton
              variant="secondary"
              className="w-full"
              onClick={() => setIsOpen(true)}
            >
              + Crear cita
            </CustomButton>
          </div>
        </div>

        {/* ---------------- DIVIDER ---------------- */}
        <div className="hidden md:flex justify-center">
          <div className="w-px h-[70%] bg-gray-300/60 rounded-full self-center" />
        </div>

        {/* ---------------- RIGHT GALLERY ---------------- */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
            Citas programadas
          </h1>

          {loading && (
            <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">
              Cargando citas...
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-600">
              No hay citas programadas aún.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {appt.patient?.full_name ?? "Paciente"}
                </h3>

                <p className="text-sm text-gray-600 mb-2">
                  {appt.description}
                </p>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {appt.scheduled_start
                      ? new Date(appt.scheduled_start).toLocaleDateString()
                      : "Pendiente"}
                  </p>

                  <p>
                    <span className="font-semibold">Estado:</span>{" "}
                    {appt.status}
                  </p>

                  <p>
                    <span className="font-semibold">Pago:</span>{" "}
                    {appt.is_paid ? "Pagado" : "Pendiente"}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="text-sm font-semibold text-teal-600 hover:underline">
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- MODAL (POPUP) ---------------- */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />

            {/* Modal box */}
            <div className="relative z-10 w-[95%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Crear cita</h2>
                  <p className="text-sm text-slate-500">
                    Completa los datos para agendar.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Paciente</label>
                    <input
                      name="patientName"
                      value={form.patientName}
                      onChange={handleChange}
                      placeholder="Ej: María González"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Duración</label>
                    <select
                      name="durationMin"
                      value={form.durationMin}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Descripción</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Ej: Masoterapia / Rehabilitación de rodilla"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Fecha</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Hora</label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Comentario (opcional)</label>
                  <textarea
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Notas adicionales..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <CustomButton
                    variant="ghost"
                    type="button"
                    onClick={closeModal}
                  >
                    Cancelar
                  </CustomButton>

                  <CustomButton
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Guardando..." : "Guardar cita"}
                  </CustomButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default Appointments
