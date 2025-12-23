import { getToken } from "./api";

const API_URL = "http://127.0.0.1:5000";

export async function getSiteInfo() {
  const res = await fetch(`${API_URL}/site/info`);
  if (!res.ok) throw new Error("Error al obtener info");
  return res.json();
}

export async function updateSiteInfo(description: string) {
  const token = getToken();

  const res = await fetch(`${API_URL}/site/info`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}

export async function getSiteLocation() {
  const res = await fetch(`${API_URL}/site/location`);
  if (!res.ok) throw new Error("Error al obtener ubicación");
  return res.json();
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
