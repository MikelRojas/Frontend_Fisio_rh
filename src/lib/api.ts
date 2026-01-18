// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

function isFormData(body: any): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // Normaliza path: asegura que empiece con "/"
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  const headers = new Headers(options.headers || {});

  // Solo setear Content-Type si NO es FormData y si no viene seteado
  if (!headers.has("Content-Type") && options.body && !isFormData(options.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  // Intenta JSON solo si el server dice que es JSON o si "parece" JSON
  const maybeJson =
    contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[");
  const data = maybeJson ? safeJsonParse(text) : null;

  if (!res.ok) {
    // Si backend manda {error/message} lo usamos; si no, tiramos snippet del HTML/texto
    const msg =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status} ${res.statusText}${
        text ? ` — ${text.slice(0, 200).replace(/\s+/g, " ")}` : ""
      }`;

    throw new Error(msg);
  }

  // Si no hay body (204) devolvemos null
  if (!text) return null as T;

  // Si backend respondió texto plano en 200, lo devolvemos tal cual
  if (!data) return text as unknown as T;

  return data as T;
}
