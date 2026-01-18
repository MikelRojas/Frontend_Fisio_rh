// src/lib/planner.ts
import { apiFetch } from "./api"

// ✅ Incluye TODOS los kinds reales del backend
export type PlannerItemKind = "event" | "block" | "manual_appointment"

export type Appointment = {
  id: string
  user_id: string | null
  description?: string | null
  comment?: string | null
  scheduled_start?: string | null
  scheduled_end?: string | null
  status: string
  is_paid: boolean
  user?: { full_name: string } | null
}

export type PlannerItem = {
  id: string
  kind: PlannerItemKind
  title: string
  note?: string | null
  start_at: string
  end_at: string
  all_day: boolean
  location?: string | null
  appointment_id?: string | null
  appointment?: Appointment | null
}

export async function listPlannerItems(params: { from: string; to: string }) {
  return apiFetch<PlannerItem[]>(
    `/api/planner?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`
  )
}

// ✅ Permitir crear también manual_appointment si alguna vez lo ocupas desde aquí
export async function createPlannerItem(payload: {
  kind: PlannerItemKind
  title: string
  note?: string
  start_at: string
  end_at: string
  all_day: boolean
  location?: string | null
}) {
  return apiFetch("/api/planner/", { method: "POST", body: JSON.stringify(payload) })
}

export async function updatePlannerItem(
  id: string,
  payload: Partial<{
    kind: PlannerItemKind
    title: string
    note: string | null
    start_at: string
    end_at: string
    all_day: boolean
    location: string | null
  }>
) {
  return apiFetch(`/api/planner/${id}`, { method: "PUT", body: JSON.stringify(payload) })
}

export async function deletePlannerItem(id: string) {
  return apiFetch(`/api/planner/${id}`, { method: "DELETE" })
}

// --- citas manuales por doctor ---
export type UserMini = { id: string; full_name: string; email: string }

export async function listUsers() {
  const res = await apiFetch<UserMini[]>(`/api/users/`)
  console.log("users from api:", res)
  return Array.isArray(res) ? res : []
}

export async function createManualAppointment(payload: {
  user_id: string | null
  scheduled_start: string
  description: string
  comment?: string | null
}) {
  return apiFetch("/api/appointments/manual", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ⚠️ OJO: tu backend para actualizar cita es PATCH /api/appointments/<id>
// y no veo un PUT /api/appointments/<id> en lo que pegaste.
// Si esto te está fallando, cámbialo a PATCH:
export async function updateAppointment(
  id: string,
  payload: Partial<{
    user_id: string | null
    scheduled_start: string
    description: string
    comment: string | null
  }>
) {
  return apiFetch(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
}

export async function deleteAppointment(id: string) {
  return apiFetch(`/api/appointments/${id}`, { method: "DELETE" })
}
