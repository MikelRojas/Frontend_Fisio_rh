import { apiFetch } from "./api"

export type UserLite = {
  id: string
  full_name: string
  email: string
  role: "admin" | "user"
  is_active: boolean
}

export async function listUsers(search?: string): Promise<UserLite[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""
  const data = await apiFetch<{ users: UserLite[] }>(`/api/users/${qs}`, { method: "GET" })
  return data.users
}
