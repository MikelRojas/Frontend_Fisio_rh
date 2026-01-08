import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { Switch } from "@/components/ui/switch"

import {
  addEntry,
  createRecord,
  deleteRecord,
  getMyRecord,
  getRecord,
  listAllRecords,
  searchRecords,
  updateRecord,
  updateEntry,
  type PatientRecord,
  type RecordEntry,
} from "@/lib/records"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { listUsers } from "@/lib/users"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Stethoscope,
} from "lucide-react"

export default function Records() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="p-6">Cargando...</div>
  if (!user) return <div className="p-6">No hay sesión.</div>

  return user.role === "admin" ? <AdminRecords /> : <PatientRecordView />
}

/* =========================
   ADMIN VIEW
========================= */
function UserEmailCombobox({
  value,
  onValueChange,
  placeholder = "Seleccioná un usuario…",
}: {
  value: string
  onValueChange: (email: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<{ full_name: string; email: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      setErr(null)
      setLoading(true)
      try {
        const list = await listUsers(query)
        setUsers(list.map((u) => ({ full_name: u.full_name, email: u.email })))
      } catch (e: any) {
        setErr(e?.message ?? "No se pudieron cargar usuarios.")
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(t)
  }, [open, query])

  const selected = value ? users.find((u) => u.email === value) : null
  const buttonLabel = value
    ? selected
      ? `${selected.full_name} — ${selected.email}`
      : value
    : placeholder

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start font-normal bg-white"
          >
            <span className={cn(!value && "text-muted-foreground")}>
              {buttonLabel}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar por nombre o correo…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron usuarios."}
            </CommandEmpty>

            {err && <div className="px-3 py-2 text-sm text-red-600">{err}</div>}

            <CommandGroup>
              {/* Opción para limpiar */}
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onValueChange("")
                  setOpen(false)
                }}
              >
                <span className="text-muted-foreground">— Sin vincular —</span>
                <Check className={cn("ml-auto h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              </CommandItem>

              {users.map((u) => (
                <CommandItem
                  key={u.email}
                  value={`${u.full_name} ${u.email}`}
                  onSelect={() => {
                    onValueChange(u.email)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{u.full_name}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === u.email ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        Solo se puede vincular con usuarios existentes.
      </p>
    </div>
  )
}

function AdminRecords() {
  const [q, setQ] = useState("")
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // expand
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsById, setDetailsById] = useState<
    Record<string, { record: PatientRecord; entries: RecordEntry[] }>
  >({})

  // dialogs
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openAddDx, setOpenAddDx] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)

  const [activeRecordId, setActiveRecordId] = useState<string | null>(null)

  async function loadAll() {
    setErr(null)
    setLoading(true)
    try {
      const list = await listAllRecords()
      setRecords(list)
    } catch (e: any) {
      setErr(e?.message ?? "No se pudieron cargar los expedientes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setErr(null)
        if (!q.trim()) {
          const list = await listAllRecords()
          setRecords(list)
          return
        }
        const res = await searchRecords(q.trim())
        setRecords(res)
      } catch (e: any) {
        setErr(e?.message ?? "Error buscando expedientes.")
      }
    }, 300)

    return () => clearTimeout(t)
  }, [q])

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)

    // cargar detalles si no están cacheados
    if (!detailsById[id]) {
      try {
        const data = await getRecord(id)
        setDetailsById((prev) => ({ ...prev, [id]: data }))
      } catch (e: any) {
        setErr(e?.message ?? "No se pudo cargar el expediente.")
      }
    }
  }

  const activeDetails = activeRecordId ? detailsById[activeRecordId] : null
  const activeRecord =
    activeDetails?.record ??
    (activeRecordId ? records.find((x) => x.id === activeRecordId) ?? null : null)

  return (
    <div
      className="min-h-[calc(100vh-80px)] p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <Card className="bg-white/90 backdrop-blur shadow-xl border border-white/40 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Expedientes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Administración de expedientes de pacientes
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre... (ej: Andrea)"
                className="bg-white"
              />
            </div>

            {err && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {err}
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">
                Cargando expedientes...
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No hay expedientes.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r) => {
                  const isOpen = expandedId === r.id
                  const details = detailsById[r.id]

                  const userEmail =
                    details?.record.user_email ?? r.user_email ?? null

                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border bg-white/80 hover:bg-white transition shadow-sm"
                    >
                      {/* Header row */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(r.id)}
                        className="w-full flex items-center justify-between px-4 py-4"
                      >
                        <span className="font-semibold text-left">
                          {r.patient_name}
                        </span>
                        {isOpen ? (
                          <ChevronDown className="h-5 w-5 text-[#2f8f90]" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-[#2f8f90]" />
                        )}
                      </button>

                      {/* Expanded */}
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Info
                              label="Nombre"
                              value={details?.record.patient_name ?? r.patient_name}
                            />
                            <Info
                              label="Edad"
                              value={String(details?.record.patient_age ?? r.patient_age)}
                            />
                            <Info
                              label="Fecha de nacimiento"
                              value={details?.record.birth_date ?? r.birth_date}
                            />
                            <Info
                              label="Teléfono"
                              value={details?.record.phone ?? r.phone}
                            />
                            <Info
                              label="Usuario vinculado"
                              value={userEmail ? userEmail : "No"}
                            />
                            <Info
                              label="Descripción extra"
                              value={
                                details?.record.extra_description ??
                                r.extra_description ??
                                "—"
                              }
                            />
                          </div>

                          {/* Entries table */}
                          <div className="rounded-xl border bg-white/70 p-3">
                            <p className="font-semibold mb-2">Diagnósticos y tratamientos</p>

                            {!details ? (
                              <div className="text-sm text-muted-foreground">
                                Cargando detalles...
                              </div>
                            ) : details.entries.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                Sin diagnósticos aún.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-muted-foreground">
                                      <th className="py-2 pr-3">Fecha</th>
                                      <th className="py-2 pr-3">Diagnóstico</th>
                                      <th className="py-2 pr-3">Tratamiento</th>
                                      <th className="py-2 pr-3">Estado</th>
                                      <th className="py-2">Acción</th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {details.entries.map((e) => (
                                      <tr key={e.id} className="border-t">
                                        <td className="py-2 pr-3 whitespace-nowrap">
                                          {e.entry_date}
                                        </td>

                                        <td className="py-2 pr-3">
                                          {e.diagnosis}
                                        </td>

                                        <td className="py-2 pr-3">
                                          {e.treatment}
                                        </td>

                                        {/* Estado visual */}
                                        <td className="py-2 pr-3">
                                          {e.is_current ? (
                                            <Badge className="bg-emerald-100 text-emerald-700">
                                              Actual
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-gray-100 text-gray-700">
                                              No vigente
                                            </Badge>
                                          )}
                                        </td>

                                        {/* ✅ Switch para marcar vigente / no vigente */}
                                        <td className="py-2">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={e.is_current}
                                              onCheckedChange={async (checked) => {
                                                try {
                                                  await updateEntry(e.id, { is_current: checked })
                                                  const updated = await getRecord(details.record.id)
                                                  setDetailsById((prev) => ({
                                                    ...prev,
                                                    [details.record.id]: updated,
                                                  }))
                                                } catch (err: any) {
                                                  setErr(
                                                    err?.message ??
                                                      "No se pudo actualizar el diagnóstico."
                                                  )
                                                }
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                              {e.is_current ? "Vigente" : "No vigente"}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-3 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-[#2f8f90] text-[#2f8f90] hover:bg-[#2f8f90]/10"
                              onClick={() => {
                                setActiveRecordId(r.id)
                                setOpenEdit(true)
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Modificar expediente
                            </Button>

                            <Button
                              type="button"
                              className="bg-[#2f8f90] hover:bg-[#277a7b] text-white"
                              onClick={() => {
                                setActiveRecordId(r.id)
                                setOpenAddDx(true)
                              }}
                            >
                              <Stethoscope className="h-4 w-4 mr-2" />
                              Agregar diagnóstico
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setActiveRecordId(r.id)
                                setOpenDelete(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Add Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar expediente
          </Button>
        </div>

        {/* Dialogs */}
        <CreateRecordDialog
          open={openCreate}
          onOpenChange={setOpenCreate}
          onCreated={async (created) => {
            setOpenCreate(false)
            await loadAll()
            setExpandedId(created.id)
            const data = await getRecord(created.id)
            setDetailsById((prev) => ({ ...prev, [created.id]: data }))
          }}
        />

        <EditRecordDialog
          open={openEdit}
          onOpenChange={setOpenEdit}
          record={activeRecord}
          onSaved={async (updated) => {
            setOpenEdit(false)
            await loadAll()
            if (updated?.id) {
              const data = await getRecord(updated.id)
              setDetailsById((prev) => ({ ...prev, [updated.id]: data }))
            }
          }}
        />

        <AddDxDialog
          open={openAddDx}
          onOpenChange={setOpenAddDx}
          recordId={activeRecordId}
          onAdded={async (rid) => {
            setOpenAddDx(false)
            if (rid) {
              const data = await getRecord(rid)
              setDetailsById((prev) => ({ ...prev, [rid]: data }))
            }
          }}
        />

        <DeleteDialog
          open={openDelete}
          onOpenChange={setOpenDelete}
          recordId={activeRecordId}
          onDeleted={async () => {
            setOpenDelete(false)
            setExpandedId(null)
            await loadAll()
          }}
        />
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3 border border-white/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

/* =========================
   PATIENT VIEW
========================= */

function PatientRecordView() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<
    { record: PatientRecord | null; entries: RecordEntry[] } | null
  >(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setErr(null)
      setLoading(true)
      try {
        const res = await getMyRecord()
        setData(res)
      } catch (e: any) {
        setErr(e?.message ?? "No se pudo cargar tu expediente.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div
      className="min-h-[calc(100vh-80px)] p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur shadow-xl border border-white/40 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Mi expediente</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {err && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {err}
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">
                Cargando...
              </div>
            ) : !data?.record ? (
              <Alert className="border-[#2f8f90]/30 bg-[#2f8f90]/10">
                <AlertDescription className="text-[#1f6c6d]">
                  Aún no hay un expediente vinculado a tu cuenta. Cuando tengas tu
                  primera cita, recordá pedirle a la doctora que vincule tu cuenta
                  a tu expediente.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info label="Nombre" value={data.record.patient_name} />
                  <Info label="Edad" value={String(data.record.patient_age)} />
                  <Info label="Fecha de nacimiento" value={data.record.birth_date} />
                  <Info label="Teléfono" value={data.record.phone} />
                  <Info
                    label="Descripción extra"
                    value={data.record.extra_description ?? "—"}
                  />
                </div>

                <div className="rounded-xl border bg-white/70 p-3">
                  <p className="font-semibold mb-2">Diagnósticos y tratamientos</p>

                  {data.entries.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Aún no hay diagnósticos registrados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Diagnóstico</th>
                            <th className="py-2 pr-3">Tratamiento</th>
                            <th className="py-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.entries.map((e) => (
                            <tr key={e.id} className="border-t">
                              <td className="py-2 pr-3 whitespace-nowrap">
                                {e.entry_date}
                              </td>
                              <td className="py-2 pr-3">{e.diagnosis}</td>
                              <td className="py-2 pr-3">{e.treatment}</td>
                              <td className="py-2">
                                {e.is_current ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    Actual
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                                    No vigente
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* =========================
   DIALOGS
========================= */

function CreateRecordDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (created: PatientRecord) => void | Promise<void>
}) {
  const [patient_name, setName] = useState("")
  const [patient_age, setAge] = useState("")
  const [birth_date, setBirth] = useState("")
  const [phone, setPhone] = useState("")
  const [extra_description, setExtra] = useState("")
  const [user_email, setUserEmail] = useState("")

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!patient_name.trim()) return setErr("Nombre requerido.")
    if (!patient_age.trim() || Number.isNaN(Number(patient_age)))
      return setErr("Edad inválida.")
    if (!birth_date.trim()) return setErr("Fecha de nacimiento requerida.")
    if (!phone.trim()) return setErr("Teléfono requerido.")

    setSaving(true)
    try {
      const res = await createRecord({
        patient_name: patient_name.trim(),
        patient_age: Number(patient_age),
        birth_date,
        phone: phone.trim(),
        extra_description: extra_description.trim() || null,
        user_email: user_email.trim() || null, // ✅ por correo
      })
      await onCreated(res.record)
      setName("")
      setAge("")
      setBirth("")
      setPhone("")
      setExtra("")
      setUserEmail("")
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo crear el expediente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setErr(null)
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar expediente</DialogTitle>
        </DialogHeader>

        {err && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {err}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit} className="space-y-3">
          <Field label="Nombre del paciente">
            <Input value={patient_name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Edad">
              <Input
                value={patient_age}
                onChange={(e) => setAge(e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Fecha de nacimiento">
              <Input
                value={birth_date}
                onChange={(e) => setBirth(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </Field>
          </div>

          <Field label="Teléfono">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          <Field label="Descripción extra">
            <Input
              value={extra_description}
              onChange={(e) => setExtra(e.target.value)}
            />
          </Field>

          <Field label="Correo del usuario (opcional)">
            <UserEmailCombobox
              value={user_email}
              onValueChange={(email) => setUserEmail(email)}
              placeholder="Seleccioná un usuario…"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2f8f90] hover:bg-[#277a7b] text-white"
            >
              {saving ? "Guardando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditRecordDialog({
  open,
  onOpenChange,
  record,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  record: PatientRecord | null
  onSaved: (updated: PatientRecord | null) => void | Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [patient_name, setName] = useState("")
  const [patient_age, setAge] = useState("")
  const [birth_date, setBirth] = useState("")
  const [phone, setPhone] = useState("")
  const [extra_description, setExtra] = useState("")
  const [user_email, setUserEmail] = useState("")

  useEffect(() => {
    if (open && record) {
      setName(record.patient_name ?? "")
      setAge(String(record.patient_age ?? ""))
      setBirth(record.birth_date ?? "")
      setPhone(record.phone ?? "")
      setExtra(record.extra_description ?? "")
      setUserEmail(record.user_email ?? "") // ✅ del JOIN
    }
    if (!open) setErr(null)
  }, [open, record])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!record) return

    setErr(null)
    if (!patient_name.trim()) return setErr("Nombre requerido.")
    if (!patient_age.trim() || Number.isNaN(Number(patient_age)))
      return setErr("Edad inválida.")
    if (!birth_date.trim()) return setErr("Fecha de nacimiento requerida.")
    if (!phone.trim()) return setErr("Teléfono requerido.")

    setSaving(true)
    try {
      const res = await updateRecord(record.id, {
        patient_name: patient_name.trim(),
        patient_age: Number(patient_age),
        birth_date,
        phone: phone.trim(),
        extra_description: extra_description.trim() || null,
        user_email: user_email.trim() || null, // ✅ por correo
      })
      await onSaved(res.record)
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo actualizar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modificar expediente</DialogTitle>
        </DialogHeader>

        {err && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {err}
            </AlertDescription>
          </Alert>
        )}

        {!record ? (
          <div className="text-sm text-muted-foreground">
            No hay expediente seleccionado.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nombre del paciente">
              <Input value={patient_name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Edad">
                <Input
                  value={patient_age}
                  onChange={(e) => setAge(e.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input
                  value={birth_date}
                  onChange={(e) => setBirth(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </Field>
            </div>

            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>

            <Field label="Descripción extra">
              <Input
                value={extra_description}
                onChange={(e) => setExtra(e.target.value)}
              />
            </Field>

            <Field label="Correo del usuario (opcional)">
              <UserEmailCombobox
                value={user_email}
                onValueChange={(email) => setUserEmail(email)}
                placeholder="Seleccioná un usuario…"
              />
              <p className="text-xs text-muted-foreground">
                Elegí “Sin vincular” para desvincular el usuario.
              </p>
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#2f8f90] hover:bg-[#277a7b] text-white"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddDxDialog({
  open,
  onOpenChange,
  recordId,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  recordId: string | null
  onAdded: (recordId: string | null) => void | Promise<void>
}) {
  const [entry_date, setDate] = useState("")
  const [diagnosis, setDx] = useState("")
  const [treatment, setTx] = useState("")
  const [is_current, setCurrent] = useState(true)

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setErr(null)
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!recordId) return setErr("No hay expediente seleccionado.")
    if (!entry_date.trim()) return setErr("Fecha requerida.")
    if (!diagnosis.trim()) return setErr("Diagnóstico requerido.")
    if (!treatment.trim()) return setErr("Tratamiento requerido.")

    setSaving(true)
    try {
      await addEntry(recordId, {
        entry_date,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        is_current,
      })
      await onAdded(recordId)
      setDate("")
      setDx("")
      setTx("")
      setCurrent(true)
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo agregar el diagnóstico.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar diagnóstico</DialogTitle>
        </DialogHeader>

        {err && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {err}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit} className="space-y-3">
          <Field label="Fecha (YYYY-MM-DD)">
            <Input
              value={entry_date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="2026-01-08"
            />
          </Field>

          <Field label="Diagnóstico">
            <Input value={diagnosis} onChange={(e) => setDx(e.target.value)} />
          </Field>

          <Field label="Tratamiento">
            <Input value={treatment} onChange={(e) => setTx(e.target.value)} />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <input
              id="is_current"
              type="checkbox"
              checked={is_current}
              onChange={(e) => setCurrent(e.target.checked)}
              className="h-4 w-4 accent-[#2f8f90]"
            />
            <Label htmlFor="is_current">Tratamiento vigente (actual)</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2f8f90] hover:bg-[#277a7b] text-white"
            >
              {saving ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  open,
  onOpenChange,
  recordId,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  recordId: string | null
  onDeleted: () => void | Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setErr(null)
  }, [open])

  async function confirmDelete() {
    setErr(null)
    if (!recordId) return setErr("No hay expediente seleccionado.")

    setSaving(true)
    try {
      await deleteRecord(recordId)
      await onDeleted()
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo eliminar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar expediente</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          ¿Seguro que querés eliminar este expediente? Esta acción no se puede
          deshacer.
        </p>

        {err && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {err}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={saving}>
            {saving ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      {children}
    </div>
  )
}
