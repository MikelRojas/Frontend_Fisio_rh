// src/lib/users.ts
import { apiFetch } from "./api"

export type UserLite = {
  id: string
  full_name: string
  email: string
  phone: string
  direccion: string | null    
  cedula: string | null       
  role: "admin" | "user"
  is_active: boolean
}

export async function listUsers(search?: string): Promise<UserLite[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""

  const data = await apiFetch<UserLite[]>(`/api/users/${qs}`, { method: "GET" })

  return Array.isArray(data) ? data : []
}
