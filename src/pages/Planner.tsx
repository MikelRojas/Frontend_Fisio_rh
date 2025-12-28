// src/pages/Planner.tsx
import React from "react"
import { addMonths } from "date-fns"
import PlannerHeader from "@/components/planner/PlannerHeader"
import MonthCalendar from "@/components/planner/MonthCalendar"
import DayTimeline from "@/components/planner/DayTimeline"
import AddPlannerItemDialog from "@/components/planner/AddPlannerItemDialog"
import { usePlannerData } from "@/components/planner/usePlannerData"

const Planner: React.FC = () => {
  const {
    monthDate,
    setMonthDate,
    selectedDay,
    setSelectedDay,
    loading,
    dayEntries,
    reloadMonth,
  } = usePlannerData()

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Agenda</h1>

      <PlannerHeader
        monthDate={monthDate}
        onPrevMonth={() => setMonthDate((d) => addMonths(d, -1))}
        onNextMonth={() => setMonthDate((d) => addMonths(d, 1))}
        onToday={() => {
          const now = new Date()
          setMonthDate(now)
          setSelectedDay(now)
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <div className="space-y-4">
          <MonthCalendar
            monthDate={monthDate}
            selectedDay={selectedDay}
            onMonthChange={(d) => setMonthDate(d)}
            onSelectDay={(d) => setSelectedDay(d)}
          />
        </div>

        <div className="min-h-[520px]">
          <DayTimeline selectedDay={selectedDay} loading={loading} entries={dayEntries} />
        </div>
      </div>

      <AddPlannerItemDialog defaultDay={selectedDay} onCreated={reloadMonth} />
    </div>
  )
}

export default Planner
