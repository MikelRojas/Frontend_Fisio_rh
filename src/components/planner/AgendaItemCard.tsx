// src/components/planner/AgendaItemCard.tsx
import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DayEntry } from "./usePlannerData"

type Props = { entry: DayEntry }

const AgendaItemCard: React.FC<Props> = ({ entry }) => {
  const isPlanner = entry.type === "planner"

  const title = isPlanner
    ? entry.data.title
    : `Cita: ${entry.data.user?.full_name ?? "Paciente"}`

  const note = isPlanner ? entry.data.note : entry.data.comment

  const start = isPlanner
    ? new Date(entry.data.start_at)
    : new Date(entry.data.scheduled_start!)
  const end = isPlanner
    ? new Date(entry.data.end_at)
    : new Date(entry.data.scheduled_end!)

  const kindLabel = isPlanner ? entry.data.kind : "appointment"

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{title}</p>
          <p className="text-sm text-muted-foreground">
            {format(start, "p", { locale: es })} – {format(end, "p", { locale: es })}
          </p>
        </div>

        <Badge variant="secondary" className="shrink-0">
          {kindLabel}
        </Badge>
      </div>

      {note ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{note}</p> : null}
    </Card>
  )
}

export default AgendaItemCard
