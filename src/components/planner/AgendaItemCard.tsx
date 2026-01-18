// src/components/planner/AgendaItemCard.tsx
import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DayEntry } from "./usePlannerData"
import { cn } from "@/lib/utils"

type Props = { entry: DayEntry; onClick?: () => void }

const AgendaItemCard: React.FC<Props> = ({ entry, onClick }) => {
  const it = entry.data

  const kind = it.kind
  const isBlock = kind === "block"
  const isAppointment = !!it.appointment_id

  const appt = it.appointment

  const title = (() => {
    if (isBlock) return `⛔ Bloqueo: ${it.title || "No disponible"}`
    if (isAppointment) return `Cita: ${appt?.user?.full_name ?? appt?.description ?? "Paciente"}`
    return it.title
  })()

  const note = (() => {
    if (isBlock) return it.note ?? ""
    if (!isAppointment) return it.note ?? ""

    const c = appt?.comment ?? ""
    // si el backend por algún registro viejo manda JSON en comment, no lo muestres crudo
    if (typeof c === "string" && c.trim().startsWith("{") && c.includes('"description"')) return ""
    return c
  })()

  const badgeLabel = (() => {
    if (isBlock) return "bloqueo"
    if (isAppointment) return "cita"
    // event / manual_appointment / otros
    if (kind === "manual_appointment") return "cita manual"
    return kind
  })()

  const badgeVariant = (() => {
    // shadcn badge variants típicos: default | secondary | destructive | outline (depende tu instalación)
    // usamos destructive para bloqueo, secondary para el resto
    return isBlock ? "destructive" : "secondary"
  })() as any

  const start = new Date(it.start_at)
  const end = new Date(it.end_at)

  return (
    <Card
      className={cn(
        "p-3 space-y-2 cursor-pointer hover:shadow transition",
        isBlock && "border border-red-300 bg-red-50/40"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-semibold truncate", isBlock && "text-red-700")}>{title}</p>
          <p className={cn("text-sm text-muted-foreground", isBlock && "text-red-700/70")}>
            {format(start, "p", { locale: es })} – {format(end, "p", { locale: es })}
          </p>
        </div>

        <Badge variant={badgeVariant} className="shrink-0">
          {badgeLabel}
        </Badge>
      </div>

      {note ? (
        <p className={cn("text-sm whitespace-pre-wrap", isBlock ? "text-red-700/80" : "text-gray-700")}>
          {note}
        </p>
      ) : null}
    </Card>
  )
}

export default AgendaItemCard
