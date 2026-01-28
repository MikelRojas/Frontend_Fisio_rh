import React, { useEffect, useMemo, useRef, useState } from "react"
import CustomButton from "./Buttom"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type ChatRole = "user" | "bot"

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  ts: number
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface ChatbotWidgetProps {
  apiBaseUrl?: string
  title?: string
  greeting?: string
  placeholder?: string
  className?: string

  /** Opcional: persistir conversación (y contexto) */
  persistKey?: string // ej: "chatbot_rh"
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  apiBaseUrl,
  title = "Asistente RH",
  greeting = "Hola 👋 ¿En qué te puedo ayudar?",
  placeholder = "Escribe tu pregunta…",
  className,
  persistKey,
}) => {
  const baseUrl = useMemo(() => {
    return apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
  }, [apiBaseUrl])

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // ✅ Nuevo: contexto de conversación (lo devuelve la API)
  const [context, setContext] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // ✅ Opcional: cargar desde localStorage
    if (persistKey) {
      const raw = localStorage.getItem(persistKey)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.messages)) return parsed.messages
        } catch (e){
            console.log(e)
        }
      }
    }
    return [{ id: uid(), role: "bot", text: greeting, ts: Date.now() }]
  })

  // ✅ Opcional: cargar contexto persistido
  useEffect(() => {
    if (!persistKey) return
    const raw = localStorage.getItem(persistKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.context === "string" || parsed?.context === null) {
        setContext(parsed.context ?? null)
      }
    } catch (e){
        console.log(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Opcional: persistir mensajes + contexto
  useEffect(() => {
    if (!persistKey) return
    localStorage.setItem(persistKey, JSON.stringify({ messages, context }))
  }, [messages, context, persistKey])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { id: uid(), role: "user", text, ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`${baseUrl}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Enviamos el contexto actual
        body: JSON.stringify({ message: text, context }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const botText = (data?.response ?? "No tengo respuesta en este momento.").toString()
      const botMsg: ChatMessage = { id: uid(), role: "bot", text: botText, ts: Date.now() }
      setMessages((prev) => [...prev, botMsg])

      // ✅ Actualizamos el contexto con lo que devuelve la API
      // Tu backend responde: { context: next_context }
      setContext(data?.context ?? null)
    } catch (e) {
      const botMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        text: "Ups 😅 No pude conectar con el servidor. Intenta de nuevo.",
        ts: Date.now(),
      }
      setMessages((prev) => [...prev, botMsg])
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") sendMessage()
  }

  const clearChat = () => {
    setMessages([{ id: uid(), role: "bot", text: greeting, ts: Date.now() }])
    setContext(null)
    if (persistKey) localStorage.removeItem(persistKey)
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>
          <CustomButton
            size="icon"
            variant="outline"
            className="
              rounded-full
              shadow-lg
              hover:scale-105
              transition
              h-15 w-15 text-2xl
            "
            aria-label="Abrir chatbot"
            title="Chatbot"
          >
            🤖
          </CustomButton>
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          sideOffset={12}
          className={cn(
            "w-[360px] p-0 border-0 bg-transparent shadow-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>RH</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Responde preguntas frecuentes
                      {/* Si querés debug visual, descomentá:
                      {" • ctx: " + (context ?? "null")} */}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <CustomButton
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    aria-label="Limpiar chat"
                    title="Limpiar"
                  >
                    🧹
                  </CustomButton>

                  <CustomButton
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar"
                    title="Cerrar"
                  >
                    ✕
                  </CustomButton>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div ref={scrollRef} className="p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          m.role === "user" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    disabled={loading}
                  />
                  <CustomButton onClick={sendMessage} loading={loading}>
                    Enviar
                  </CustomButton>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Tip: presiona Enter para enviar
                </p>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ChatbotWidget
