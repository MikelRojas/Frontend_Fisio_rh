// src/components/planner/MonthCalendar.tsx
import React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"

type Props = {
  monthDate: Date
  selectedDay: Date
  onMonthChange: (d: Date) => void
  onSelectDay: (d: Date) => void
}

const MonthCalendar: React.FC<Props> = ({ monthDate, selectedDay, onMonthChange, onSelectDay }) => {
  return (
    <Card className="p-3">
      <Calendar
        mode="single"
        selected={selectedDay}
        month={monthDate}
        onMonthChange={onMonthChange}
        onSelect={(d) => d && onSelectDay(d)}
        className="w-full"
      />
    </Card>
  )
}

export default MonthCalendar
