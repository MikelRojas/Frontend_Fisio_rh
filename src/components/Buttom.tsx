// npx shadcn@latest add button
import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  loading = false,
  icon,
  iconRight,
  className,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="animate-spin">🔄</span>}
      {icon && <span>{icon}</span>}
      {children}
      {iconRight && <span>{iconRight}</span>}
    </Button>
  )
}

export default CustomButton
