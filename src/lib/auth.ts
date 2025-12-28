import { apiFetch, setToken, clearToken } from "./api";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type LoginResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in_minutes?: number;
  user: User;
};

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function register(full_name: string, email: string, password: string) {
  const data = await apiFetch<{ message: string; user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password }),
  });
  return data.user;
}


export async function me(): Promise<User> {
  const data = await apiFetch<{ user: User }>("/api/auth/me", { method: "GET" });
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function updateMe(full_name: string, email: string): Promise<User> {
  const data = await apiFetch<{ message: string; user: User }>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify({ full_name, email }),
  });
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
}

export async function changeMyPassword(current_password: string, new_password: string) {
  const data = await apiFetch<{ message: string }>("/api/auth/me/password", {
    method: "PUT",
    body: JSON.stringify({ current_password, new_password }),
  });
  return data;
}

export function logout() {
  clearToken();
  localStorage.removeItem("user");
}

export function getCachedUser(): User | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, token: string, new_password: string) {
  return apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, token, new_password }),
  });
}