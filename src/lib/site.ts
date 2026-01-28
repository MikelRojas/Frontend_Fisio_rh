import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export async function getSiteInfo() {
  const res = await fetch(`${API_URL}/site/info`);
  if (!res.ok) throw new Error("Error al obtener info");
  return res.json(); // { info: string }
}

export async function updateSiteInfo(info: string) {
  const token = getToken();

  const res = await fetch(`${API_URL}/site/info`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // ✅ backend espera { info: "..." }
    body: JSON.stringify({ info }),
  });

  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}

export async function getSiteLocation() {
  const res = await fetch(`${API_URL}/site/location`);
  if (!res.ok) throw new Error("Error al obtener ubicación");
  return res.json(); // { location: string }
}

export async function updateSiteLocation(location: string) {
  const token = getToken();

  const res = await fetch(`${API_URL}/site/location`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ location }),
  });

  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}
