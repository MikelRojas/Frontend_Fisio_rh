// src/components/planner/PlannerHeader.tsx
import React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import CustomButton from "@/components/Buttom" // tu CustomButton
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  monthDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

const PlannerHeader: React.FC<Props> = ({ monthDate, onPrevMonth, onNextMonth, onToday }) => {
  return (
    <Card className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CustomButton variant="outline" size="icon" onClick={onPrevMonth} icon={<ChevronLeft />} />
        <CustomButton variant="outline" size="icon" onClick={onNextMonth} icon={<ChevronRight />} />
        <CustomButton variant="secondary" onClick={onToday}>
          Hoy
        </CustomButton>
      </div>

      <h2 className="text-lg md:text-xl font-semibold">
        {format(monthDate, "MMMM yyyy", { locale: es })}
      </h2>

      <div className="w-[120px]" />
    </Card>
  )
}

export default PlannerHeader
