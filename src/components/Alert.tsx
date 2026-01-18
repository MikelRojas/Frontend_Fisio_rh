import React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Info, TriangleAlert } from "lucide-react"

type AlertType = "success" | "error" | "warning" | "info"

type CustomAlertProps = {
  type?: AlertType
  title: string
  description?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  onClose?: () => void
  className?: string
}

function defaultIcon(type: AlertType) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-4 w-4" />
    case "error":
      return <AlertCircle className="h-4 w-4" />
    case "warning":
      return <TriangleAlert className="h-4 w-4" />
    case "info":
    default:
      return <Info className="h-4 w-4" />
  }
}

function variantFromType(type: AlertType): "default" | "destructive" {
  return type === "error" ? "destructive" : "default"
}

export default function CustomAlert({
  type = "info",
  title,
  description,
  icon,
  actions,
  onClose,
  className,
}: CustomAlertProps) {
  const variant = variantFromType(type)

  // Colores extra (aparte del variant)
  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : type === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : type === "info"
      ? "border-sky-200 bg-sky-50 text-sky-900"
      : "" 

  return (
    <Alert
      variant={variant}
      className={cn(
        "relative flex items-start gap-3",
        variant === "default" && tone,
        className
      )}
    >
      <div className="mt-0.5">{icon ?? defaultIcon(type)}</div>

      <div className="min-w-0 flex-1">
        <AlertTitle className="pr-8">{title}</AlertTitle>

        {description ? (
          <AlertDescription className="mt-1">
            {description}
          </AlertDescription>
        ) : null}

        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-black/5"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </Alert>
  )
}
