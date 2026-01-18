// src/components/planner/AddPlannerItemDialog.tsx
import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CustomButton from "@/components/Buttom"
import { createManualAppointment, createPlannerItem, listUsers, type UserMini } from "@/lib/planner"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import CustomAlert from "@/components/Alert"

type Props = { defaultDay: Date; onCreated?: () => void }

function toLocalDatetimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function parseLocalDatetime(v: string) {
  // datetime-local siempre viene sin tz; JS lo interpreta como local y toISOString lo manda en UTC.
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

const AddPlannerItemDialog: React.FC<Props> = ({ defaultDay, onCreated }) => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info"
    title: string
    description?: string
  } | null>(null)

  const defaultStart = useMemo(() => {
    const d = new Date(defaultDay)
    d.setHours(9, 0, 0, 0)
    return d
  }, [defaultDay])

  const defaultEnd = useMemo(() => {
    const d = new Date(defaultDay)
    d.setHours(10, 0, 0, 0)
    return d
  }, [defaultDay])

  const [tab, setTab] = useState<"event" | "appointment" | "block">("event")

  // event fields
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [startAt, setStartAt] = useState(toLocalDatetimeInputValue(defaultStart))
  const [endAt, setEndAt] = useState(toLocalDatetimeInputValue(defaultEnd))

  // manual appointment fields
  const [users, setUsers] = useState<UserMini[]>([])
  const [userId, setUserId] = useState<string>("")
  const [desc, setDesc] = useState("Cita")
  const [comment, setComment] = useState("")
  const [apptStart, setApptStart] = useState(toLocalDatetimeInputValue(defaultStart))

  // block fields
  const [blockTitle, setBlockTitle] = useState("Bloqueo")
  const [blockNote, setBlockNote] = useState("")
  const [blockStart, setBlockStart] = useState(toLocalDatetimeInputValue(defaultStart))
  const [blockEnd, setBlockEnd] = useState(toLocalDatetimeInputValue(defaultEnd))

  useEffect(() => {
    if (!open) return
    listUsers().then(setUsers).catch(() => setUsers([]))
  }, [open])

  const reset = () => {
    setAlert(null)

    setTitle("")
    setNote("")
    setStartAt(toLocalDatetimeInputValue(defaultStart))
    setEndAt(toLocalDatetimeInputValue(defaultEnd))

    setUserId("")
    setDesc("Cita")
    setComment("")
    setApptStart(toLocalDatetimeInputValue(defaultStart))

    setBlockTitle("Bloqueo")
    setBlockNote("")
    setBlockStart(toLocalDatetimeInputValue(defaultStart))
    setBlockEnd(toLocalDatetimeInputValue(defaultEnd))

    setTab("event")
  }

  const validateRange = (sStr: string, eStr: string) => {
    const s = parseLocalDatetime(sStr)
    const e = parseLocalDatetime(eStr)
    if (!s || !e) {
      setAlert({ type: "warning", title: "Fecha/hora inválida", description: "Usa el selector de fecha y hora." })
      return null
    }
    if (!(e.getTime() > s.getTime())) {
      setAlert({ type: "warning", title: "Horas inválidas", description: "La hora fin debe ser mayor a la hora inicio." })
      return null
    }
    return { s, e }
  }

  const submitEvent = async () => {
    setAlert(null)

    if (!title.trim()) {
      setAlert({ type: "warning", title: "Título requerido" })
      return
    }

    const r = validateRange(startAt, endAt)
    if (!r) return

    await createPlannerItem({
      kind: "event",
      title: title.trim(),
      note: note.trim() || undefined,
      start_at: r.s.toISOString(),
      end_at: r.e.toISOString(),
      all_day: false,
    })
  }

  const submitManualAppointment = async () => {
    setAlert(null)

    if (!desc.trim()) {
      setAlert({ type: "warning", title: "Descripción requerida" })
      return
    }

    const s = parseLocalDatetime(apptStart)
    if (!s) {
      setAlert({ type: "warning", title: "Fecha/hora inválida", description: "Usa el selector de fecha y hora." })
      return
    }

    await createManualAppointment({
      user_id: userId ? userId : null,
      scheduled_start: s.toISOString(),
      description: desc.trim(),
      comment: comment.trim() || null,
    })
  }

  const submitBlock = async () => {
    setAlert(null)

    // “Motivo” requerido (aunque tengas default)
    if (!blockTitle.trim()) {
      setAlert({ type: "warning", title: "Motivo requerido", description: "Describe por qué se bloquea ese tiempo." })
      return
    }

    const r = validateRange(blockStart, blockEnd)
    if (!r) return

    await createPlannerItem({
      kind: "block",
      title: blockTitle.trim(),
      note: blockNote.trim() || undefined,
      start_at: r.s.toISOString(),
      end_at: r.e.toISOString(),
      all_day: false,
    })
  }

  const submit = async () => {
    setSaving(true)
    setAlert(null)
    try {
      if (tab === "event") await submitEvent()
      if (tab === "appointment") await submitManualAppointment()
      if (tab === "block") await submitBlock()

      setAlert({ type: "success", title: "Guardado", description: "Se agregó a la agenda." })
      onCreated?.()
      setOpen(false)
      reset()
    } catch (err: any) {
      // Si el backend devuelve “Time slot already occupied”, lo mostramos bonito:
      const msg = err?.message || ""
      if (String(msg).toLowerCase().includes("occupied")) {
        setAlert({ type: "warning", title: "Choque de horario", description: "Ese espacio ya está ocupado en la agenda." })
      } else {
        setAlert({ type: "error", title: "No se pudo guardar", description: msg || "Error inesperado." })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <CustomButton icon={<Plus />} className="fixed bottom-6 right-6 rounded-full shadow-lg">
          Agregar
        </CustomButton>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar a la agenda ({format(defaultDay, "yyyy-MM-dd")})</DialogTitle>
        </DialogHeader>

        {alert && (
          <CustomAlert
            type={alert.type}
            title={alert.title}
            description={alert.description}
            onClose={() => setAlert(null)}
          />
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="event">Evento</TabsTrigger>
            <TabsTrigger value="appointment">Cita</TabsTrigger>
            <TabsTrigger value="block">Bloqueo</TabsTrigger>
          </TabsList>

          <TabsContent value="event">
            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label>
                  Título <span className="text-red-500">*</span>
                </Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión, terapia, etc." />
              </div>

              <div className="space-y-1">
                <Label>Nota</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalles…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>
                    Fin <span className="text-red-500">*</span>
                  </Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <CustomButton variant="outline" onClick={() => setOpen(false)}>Cancelar</CustomButton>
                <CustomButton loading={saving} onClick={submit}>Guardar</CustomButton>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="appointment">
            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label>Usuario (opcional)</Label>
                <select className="w-full border rounded-md p-2" value={userId} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">Sin usuario (cliente sin cuenta)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Cita por WhatsApp" />
              </div>

              <div className="space-y-1">
                <Label>Comentario</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo, observaciones…" />
              </div>

              <div className="space-y-1">
                <Label>
                  Inicio (duración fija 1h) <span className="text-red-500">*</span>
                </Label>
                <Input type="datetime-local" value={apptStart} onChange={(e) => setApptStart(e.target.value)} required />
              </div>

              <div className="flex justify-end gap-2">
                <CustomButton variant="outline" onClick={() => setOpen(false)}>Cancelar</CustomButton>
                <CustomButton loading={saving} onClick={submit}>Guardar</CustomButton>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="block">
            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label>
                  Motivo del bloqueo <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  placeholder="Ej: Almuerzo, reunión externa, no disponible…"
                />
              </div>

              <div className="space-y-1">
                <Label>Detalle</Label>
                <Textarea
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Opcional: más contexto del bloqueo…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>
                    Fin <span className="text-red-500">*</span>
                  </Label>
                  <Input type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <CustomButton variant="outline" onClick={() => setOpen(false)}>Cancelar</CustomButton>
                <CustomButton loading={saving} onClick={submit}>Bloquear</CustomButton>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AddPlannerItemDialog
