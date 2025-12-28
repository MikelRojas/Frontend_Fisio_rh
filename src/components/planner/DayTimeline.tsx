// src/components/planner/DayTimeline.tsx
import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import AgendaItemCard from "./AgendaItemCard"
import type { DayEntry } from "./usePlannerData"

type Props = {
  selectedDay: Date
  loading: boolean
  entries: DayEntry[]
}

const DayTimeline: React.FC<Props> = ({ selectedDay, loading, entries }) => {
  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(selectedDay, "EEEE d MMMM", { locale: es })}
        </h3>
        <p className="text-sm text-muted-foreground">{entries.length} actividades</p>
      </div>

      <Separator className="my-3" />

      <ScrollArea className="flex-1 pr-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando agenda…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay actividades para este día.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const key =
                e.type === "planner" ? `p-${e.data.id}` : `a-${e.data.id}`
              return <AgendaItemCard key={key} entry={e} />
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}

export default DayTimeline
