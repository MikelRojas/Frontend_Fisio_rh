// src/components/planner/DayTimeline.tsx
import React, { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import AgendaItemCard from "./AgendaItemCard"
import type { DayEntry } from "./usePlannerData"
import EditAgendaEntryDialog from "./EditAgendaEntryDialog"
import type { PlannerItem } from "@/lib/planner"

type Props = {
  selectedDay: Date
  loading: boolean
  entries: DayEntry[]
  onChanged?: () => void
}

const DayTimeline: React.FC<Props> = ({ selectedDay, loading, entries, onChanged }) => {
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<PlannerItem | null>(null)

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
            {entries.map((e) => (
              <AgendaItemCard
                key={`p-${e.data.id}`}
                entry={e}
                onClick={() => {
                  setItem(e.data)
                  setOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <EditAgendaEntryDialog
        open={open}
        onOpenChange={setOpen}
        item={item}
        onSaved={onChanged}
      />
    </Card>
  )
}

export default DayTimeline
