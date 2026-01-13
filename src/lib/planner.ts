// src/lib/planner.ts
import { apiFetch } from "@/lib/api"

export type PlannerItemKind = "event" | "manual_appointment" | "block"

export type PlannerItem = {
  id: string
  kind: PlannerItemKind
  title: string
  note?: string | null
  start_at: string // ISO
  end_at: string   // ISO
  all_day: boolean
  location?: string | null
  created_by?: string | null
  appointment_id?: string | null
}

export type Appointment = {
  id: string
  user_id: string
  comment?: string | null
  requested_start?: string | null
  requested_end?: string | null
  scheduled_start?: string | null
  scheduled_end?: string | null
  status: string
  is_paid: boolean
  paid_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  user?: { full_name: string } | null
}

export async function listPlannerItems(params: { from: string; to: string }) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch<PlannerItem[]>(`/api/planner/?${qs}`, { method: "GET" })
}

export async function createPlannerItem(payload: {
  kind: PlannerItemKind
  title: string
  note?: string
  start_at: string
  end_at: string
  all_day?: boolean
  location?: string
}) {
  return apiFetch<PlannerItem>(`/api/planner/`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}


export async function listAppointments(params: { from: string; to: string; status?: string }) {
  const qs = new URLSearchParams(params as any).toString()
  return apiFetch<Appointment[]>(`/api/appointments/?${qs}`, { method: "GET" })
}

