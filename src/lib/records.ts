// src/lib/records.ts
import { apiFetch } from "./api";

export type PatientRecord = {
  id: string;
  patient_name: string;
  patient_age: number;
  birth_date: string;
  phone: string;
  extra_description?: string | null;
  user_email?: string | null;
  created_at?: string;
  updated_at?: string;
};


export type RecordEntry = {
  id: string;
  record_id: string;
  entry_date: string; // YYYY-MM-DD
  diagnosis: string;
  treatment: string;
  is_current: boolean;
  created_at?: string;
};

export async function listAllRecords(): Promise<PatientRecord[]> {
  const data = await apiFetch<{ records: PatientRecord[] }>("/api/records/", { method: "GET" });
  return data.records;
}

export async function searchRecords(q: string): Promise<PatientRecord[]> {
  const data = await apiFetch<{ records: PatientRecord[] }>(`/api/records/search?q=${encodeURIComponent(q)}`, {
    method: "GET",
  });
  return data.records;
}

export async function getRecord(recordId: string): Promise<{ record: PatientRecord; entries: RecordEntry[] }> {
  return apiFetch(`/api/records/${recordId}`, { method: "GET" });
}

export async function createRecord(payload: Partial<PatientRecord>) {
  return apiFetch<{ record: PatientRecord }>("/api/records/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRecord(recordId: string, payload: Partial<PatientRecord>) {
  return apiFetch<{ record: PatientRecord }>(`/api/records/${recordId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecord(recordId: string) {
  return apiFetch<{ message: string }>(`/api/records/${recordId}`, { method: "DELETE" });
}

export async function addEntry(recordId: string, payload: Partial<RecordEntry>) {
  return apiFetch<{ entry: RecordEntry }>(`/api/records/${recordId}/entries`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyRecord(): Promise<{ record: PatientRecord | null; entries: RecordEntry[] }> {
  return apiFetch("/api/records/me", { method: "GET" });
}

export async function updateEntry(entryId: string, payload: Partial<RecordEntry>) {
  const data = await apiFetch<{ entry: RecordEntry }>(`/api/records/entries/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return data.entry
}
