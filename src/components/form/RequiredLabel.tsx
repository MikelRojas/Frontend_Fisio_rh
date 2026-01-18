import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof Label> & {
  required?: boolean
}

export default function RequiredLabel({ required, className, children, ...props }: Props) {
  return (
    <Label className={cn("flex items-center gap-1", className)} {...props}>
      {children}
      {required ? <span className="text-red-500">*</span> : null}
    </Label>
  )
}
