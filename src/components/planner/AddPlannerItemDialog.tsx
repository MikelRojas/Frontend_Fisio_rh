// src/components/planner/AddPlannerItemDialog.tsx
import React, { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CustomButton from "@/components/Buttom"
import { createPlannerItem } from "@/lib/planner"
import type { PlannerItemKind } from "@/lib/planner"
import { format } from "date-fns"
import { Plus } from "lucide-react"

type Props = {
  defaultDay: Date
  onCreated?: () => void
}

function toLocalDatetimeInputValue(d: Date) {
  // Para input type="datetime-local" (sin timezone)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseLocalDatetime(v: string) {
  // Interpreta el datetime-local como hora local
  return new Date(v)
}

const AddPlannerItemDialog: React.FC<Props> = ({ defaultDay, onCreated }) => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const [tab, setTab] = useState<PlannerItemKind>("event")

  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [startAt, setStartAt] = useState(toLocalDatetimeInputValue(defaultStart))
  const [endAt, setEndAt] = useState(toLocalDatetimeInputValue(defaultEnd))
  const [allDay, setAllDay] = useState(false)

  const reset = () => {
    setTitle("")
    setNote("")
    setStartAt(toLocalDatetimeInputValue(defaultStart))
    setEndAt(toLocalDatetimeInputValue(defaultEnd))
    setAllDay(false)
    setTab("event")
  }

  const submit = async () => {
    if (!title.trim()) return alert("Título requerido")
    const s = parseLocalDatetime(startAt)
    const e = parseLocalDatetime(endAt)
    if (!(e.getTime() > s.getTime())) return alert("La hora fin debe ser mayor a la hora inicio")

    setSaving(true)
    try {
      await createPlannerItem({
        kind: tab,
        title: title.trim(),
        note: note.trim() || undefined,
        start_at: s.toISOString(),
        end_at: e.toISOString(),
        all_day: allDay,
      })
      onCreated?.()
      setOpen(false)
      reset()
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
          <DialogTitle>
            Agregar a la agenda ({format(defaultDay, "yyyy-MM-dd")})
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as PlannerItemKind)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="event">Evento</TabsTrigger>
            <TabsTrigger value="manual_appointment">Cita manual</TabsTrigger>
          </TabsList>

          <TabsContent value="event">
            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión, terapia, etc." />
              </div>

              <div className="space-y-1">
                <Label>Nota</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalles…" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Inicio</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Fin</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <CustomButton variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </CustomButton>
                <CustomButton loading={saving} onClick={submit}>
                  Guardar
                </CustomButton>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="manual_appointment">
            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label>Paciente / Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Juan Pérez (cita manual)" />
              </div>

              <div className="space-y-1">
                <Label>Detalle</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo, observaciones, etc." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Inicio</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Fin</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <CustomButton variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </CustomButton>
                <CustomButton loading={saving} onClick={submit}>
                  Guardar
                </CustomButton>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AddPlannerItemDialog
