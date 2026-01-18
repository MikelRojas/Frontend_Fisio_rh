// src/components/planner/EditAgendaEntryDialog.tsx
import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import CustomButton from "@/components/Buttom"
import type { PlannerItem, UserMini } from "@/lib/planner"
import {
  deleteAppointment,
  deletePlannerItem,
  listUsers,
  updateAppointment,
  updatePlannerItem,
} from "@/lib/planner"
import CustomAlert from "@/components/Alert"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: PlannerItem | null
  onSaved?: () => void
}

function toLocalDatetimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

function parseLocalDatetimeSafe(v: string) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

type AlertState =
  | { type: "success" | "error" | "warning" | "info"; title: string; description?: string }
  | null

const EditAgendaEntryDialog: React.FC<Props> = ({ open, onOpenChange, item, onSaved }) => {
  const isAppointment = !!item?.appointment_id

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [alert, setAlert] = useState<AlertState>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // errores por campo
  const [errors, setErrors] = useState<Record<string, string>>({})

  // --- Event fields ---
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")

  // --- Appointment fields ---
  const [users, setUsers] = useState<UserMini[]>([])
  const [userId, setUserId] = useState<string>("") // "" => null
  const [desc, setDesc] = useState("")
  const [comment, setComment] = useState("")
  const [scheduledStart, setScheduledStart] = useState("")

  // helpers UI
  const RequiredMark = useMemo(() => <span className="text-red-500">*</span>, [])

  const clearFieldError = (key: string) => {
    if (!errors[key]) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  useEffect(() => {
    // reset visual states when opening/closing
    if (!open) {
      setConfirmDelete(false)
      setDeleting(false)
      setSaving(false)
      setAlert(null)
      setErrors({})
      return
    }

    setAlert(null)
    setErrors({})

    if (!item) return

    // set base
    setStartAt(toLocalDatetimeInputValue(new Date(item.start_at)))
    setEndAt(toLocalDatetimeInputValue(new Date(item.end_at)))
    setTitle(item.title ?? "")
    setNote(item.note ?? "")

    if (item.appointment_id) {
      const appt = item.appointment
      setUserId(appt?.user_id ?? "")
      setDesc(appt?.description ?? "Cita")
      setComment(appt?.comment ?? "")
      setScheduledStart(toLocalDatetimeInputValue(new Date(item.start_at)))

      listUsers().then(setUsers).catch(() => setUsers([]))
    } else {
      setUsers([])
      setUserId("")
      setDesc("")
      setComment("")
      setScheduledStart("")
    }
  }, [open, item])

  const validateEvent = () => {
    const next: Record<string, string> = {}

    if (!title.trim()) next.title = "Título requerido."

    const s = parseLocalDatetimeSafe(startAt)
    const e = parseLocalDatetimeSafe(endAt)

    if (!s) next.startAt = "Inicio inválido (usa el selector de fecha/hora)."
    if (!e) next.endAt = "Fin inválido (usa el selector de fecha/hora)."

    if (s && e && !(e.getTime() > s.getTime())) {
      next.endAt = "La hora fin debe ser mayor a la hora inicio."
    }

    setErrors(next)
    return { ok: Object.keys(next).length === 0, s, e }
  }

  const validateAppointment = () => {
    const next: Record<string, string> = {}

    if (!desc.trim()) next.desc = "Descripción requerida."

    const ss = parseLocalDatetimeSafe(scheduledStart)
    if (!ss) next.scheduledStart = "Inicio inválido (usa el selector de fecha/hora)."

    setErrors(next)
    return { ok: Object.keys(next).length === 0, ss }
  }

  const onSave = async () => {
    if (!item) return

    setAlert(null)
    setSaving(true)

    try {
      if (item.appointment_id) {
        const { ok, ss } = validateAppointment()
        if (!ok || !ss) {
          setAlert({ type: "warning", title: "Revisa los campos marcados con *" })
          return
        }

        await updateAppointment(item.appointment_id!, {
          user_id: userId ? userId : null,
          description: desc.trim(),
          comment: comment.trim() || null,
          scheduled_start: ss.toISOString(),
        })
      } else {
        const { ok, s, e } = validateEvent()
        if (!ok || !s || !e) {
          setAlert({ type: "warning", title: "Revisa los campos marcados con *" })
          return
        }

        await updatePlannerItem(item.id, {
          title: title.trim(),
          note: note.trim() || null,
          start_at: s.toISOString(),
          end_at: e.toISOString(),
        })
      }

      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      setAlert({
        type: "error",
        title: "No se pudo guardar",
        description: err?.message ?? "Error inesperado.",
      })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = () => {
    if (!item) return
    setAlert(null)
    setErrors({})
    setConfirmDelete(true)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isAppointment ? "Editar cita" : "Editar evento"}</DialogTitle>
        </DialogHeader>

        {alert && (
          <CustomAlert
            type={alert.type}
            title={alert.title}
            description={alert.description}
            onClose={() => setAlert(null)}
          />
        )}

        {confirmDelete && (
          <CustomAlert
            type="warning"
            title="¿Eliminar este elemento?"
            description="Esta acción no se puede deshacer."
            onClose={() => {
              setConfirmDelete(false)
              setDeleting(false)
            }}
            actions={
              <>
                <CustomButton
                  variant="outline"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmDelete(false)
                    setDeleting(false)
                  }}
                >
                  Cancelar
                </CustomButton>

                <CustomButton
                  variant="destructive"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true)
                    try {
                      if (item.appointment_id) await deleteAppointment(item.appointment_id!)
                      else await deletePlannerItem(item.id)

                      onOpenChange(false)
                      onSaved?.()
                    } catch (err: any) {
                      setAlert({
                        type: "error",
                        title: "No se pudo eliminar",
                        description: err?.message ?? "Error inesperado.",
                      })
                    } finally {
                      setDeleting(false)
                      setConfirmDelete(false)
                    }
                  }}
                >
                  Eliminar
                </CustomButton>
              </>
            }
          />
        )}

        <Card className="p-4 space-y-3">
          {item.appointment_id ? (
            <>
              <div className="space-y-1">
                <Label>Usuario (opcional)</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <option value="">Sin usuario (cliente sin cuenta)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Descripción {RequiredMark}
                </Label>
                <Input
                  value={desc}
                  onChange={(e) => {
                    setDesc(e.target.value)
                    clearFieldError("desc")
                  }}
                  placeholder="Ej: Cita manual"
                  aria-invalid={!!errors.desc}
                />
                {errors.desc ? <p className="text-sm text-red-500">{errors.desc}</p> : null}
              </div>

              <div className="space-y-1">
                <Label>Comentario</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Motivo, observaciones…"
                />
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Inicio (duración fija 1h) {RequiredMark}
                </Label>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => {
                    setScheduledStart(e.target.value)
                    clearFieldError("scheduledStart")
                  }}
                  aria-invalid={!!errors.scheduledStart}
                />
                {errors.scheduledStart ? (
                  <p className="text-sm text-red-500">{errors.scheduledStart}</p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  Título {RequiredMark}
                </Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    clearFieldError("title")
                  }}
                  aria-invalid={!!errors.title}
                />
                {errors.title ? <p className="text-sm text-red-500">{errors.title}</p> : null}
              </div>

              <div className="space-y-1">
                <Label>Nota</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1">
                    Inicio {RequiredMark}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => {
                      setStartAt(e.target.value)
                      clearFieldError("startAt")
                    }}
                    aria-invalid={!!errors.startAt}
                  />
                  {errors.startAt ? (
                    <p className="text-sm text-red-500">{errors.startAt}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <Label className="flex items-center gap-1">
                    Fin {RequiredMark}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => {
                      setEndAt(e.target.value)
                      clearFieldError("endAt")
                    }}
                    aria-invalid={!!errors.endAt}
                  />
                  {errors.endAt ? <p className="text-sm text-red-500">{errors.endAt}</p> : null}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <CustomButton variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </CustomButton>

            <div className="flex gap-2">
              <CustomButton
                variant="destructive"
                disabled={confirmDelete}
                onClick={onDelete}
              >
                Eliminar
              </CustomButton>

              <CustomButton loading={saving} onClick={onSave}>
                Guardar cambios
              </CustomButton>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default EditAgendaEntryDialog
