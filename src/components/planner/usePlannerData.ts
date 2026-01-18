// src/components/planner/usePlannerData.ts
import { useEffect, useMemo, useState } from "react"
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns"
import type { PlannerItem } from "@/lib/planner"
import { listPlannerItems } from "@/lib/planner"

export type DayEntry = { type: "planner"; data: PlannerItem }

export function usePlannerData() {
  const [monthDate, setMonthDate] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const from = startOfMonth(monthDate).toISOString()
      const to = endOfMonth(monthDate).toISOString()
      const pItems = await listPlannerItems({ from, to })
      setPlannerItems(pItems)
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar la agenda.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [monthDate])

  const dayEntries: DayEntry[] = useMemo(() => {
    const dayStart = startOfDay(selectedDay).getTime()
    const dayEnd = endOfDay(selectedDay).getTime()

    return plannerItems
      .filter((it) => {
        const s = new Date(it.start_at).getTime()
        const e = new Date(it.end_at).getTime()
        return s <= dayEnd && e >= dayStart
      })
      .map((it) => ({ type: "planner" as const, data: it }))
      .sort((x, y) => new Date(x.data.start_at).getTime() - new Date(y.data.start_at).getTime())
  }, [plannerItems, selectedDay])

  return {
    monthDate,
    setMonthDate,
    selectedDay,
    setSelectedDay,
    loading,
    dayEntries,
    error,
    reloadMonth: () => load(),
  }
}
