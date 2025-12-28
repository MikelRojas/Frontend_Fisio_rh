// src/components/planner/usePlannerData.ts
import { useEffect, useMemo, useState } from "react"
import { endOfMonth, endOfDay, startOfDay, startOfMonth } from "date-fns"
import type { Appointment, PlannerItem } from "@/lib/planner"
import { listAppointments, listPlannerItems } from "@/lib/planner"

export type DayEntry =
  | { type: "planner"; data: PlannerItem }
  | { type: "appointment"; data: Appointment }

export function usePlannerData() {
  const [monthDate, setMonthDate] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const from = startOfMonth(monthDate).toISOString()
        const to = endOfMonth(monthDate).toISOString()

        // Si tu backend todavía no tiene /api/planner, podés comentar esto por ahora.
        const [pItems, appts] = await Promise.all([
          listPlannerItems({ from, to }),
          listAppointments({ from, to, status: "confirmed" }),
        ])

        setPlannerItems(pItems)
        setAppointments(appts)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [monthDate])

  const dayEntries: DayEntry[] = useMemo(() => {
    const dayStart = startOfDay(selectedDay).getTime()
    const dayEnd = endOfDay(selectedDay).getTime()

    const p = plannerItems
      .filter((it) => {
        const s = new Date(it.start_at).getTime()
        const e = new Date(it.end_at).getTime()
        return s <= dayEnd && e >= dayStart
      })
      .map((it) => ({ type: "planner" as const, data: it }))

    const a = appointments
      .filter((ap) => ap.scheduled_start && ap.scheduled_end)
      .filter((ap) => {
        const s = new Date(ap.scheduled_start!).getTime()
        const e = new Date(ap.scheduled_end!).getTime()
        return s <= dayEnd && e >= dayStart
      })
      .map((ap) => ({ type: "appointment" as const, data: ap }))

    return [...p, ...a].sort((x, y) => {
      const xs =
        x.type === "planner"
          ? new Date(x.data.start_at).getTime()
          : new Date(x.data.scheduled_start!).getTime()
      const ys =
        y.type === "planner"
          ? new Date(y.data.start_at).getTime()
          : new Date(y.data.scheduled_start!).getTime()
      return xs - ys
    })
  }, [plannerItems, appointments, selectedDay])

  return {
    monthDate,
    setMonthDate,
    selectedDay,
    setSelectedDay,
    loading,
    dayEntries,
    reloadMonth: () => setMonthDate((d) => new Date(d)),
  }
}
