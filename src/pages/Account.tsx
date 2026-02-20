import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/AuthContext"
import { changeMyPassword, updateMe } from "@/lib/auth"
import { useNavigate } from "react-router-dom"

type Mode = "none" | "edit" | "password"

export default function Account() {
  const { user, logout, isLoading, refresh } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("none")

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [direccion, setDireccion] = useState("")
  const [cedula, setCedula] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const initial = useMemo(() => {
    if (!user)
      return {
        fullName: "",
        email: "",
        phone: "",
        direccion: "",
        cedula: "",
      }

    return {
      fullName: user.full_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      direccion: user.direccion ?? "",
      cedula: user.cedula ?? "",
    }
  }, [user])

  function handleLogout() {
    logout()
    navigate("/", { replace: true })
  }

  function openEdit() {
    setMsg(null)
    setMode("edit")
    setFullName(initial.fullName)
    setEmail(initial.email)
    setPhone(initial.phone)
    setDireccion(initial.direccion)
    setCedula(initial.cedula)
  }

  function openPassword() {
    setMsg(null)
    setMode("password")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  function closeForms() {
    setMode("none")
    setMsg(null)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!fullName.trim()) return setMsg({ type: "err", text: "El nombre es requerido." })
    if (!email.trim()) return setMsg({ type: "err", text: "El email es requerido." })
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ type: "err", text: "Email inválido." })
    if (!phone.trim()) return setMsg({ type: "err", text: "El teléfono es requerido." })
    if (!direccion.trim()) return setMsg({ type: "err", text: "La dirección es requerida." })
    if (!cedula.trim()) return setMsg({ type: "err", text: "La cédula es requerida." })

    setSaving(true)
    try {
      await updateMe(fullName, email.toLowerCase(), phone, direccion, cedula)
      await refresh()
      setMsg({ type: "ok", text: "Datos actualizados correctamente." })
      setMode("none")
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message ?? "No se pudo actualizar." })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!currentPassword) return setMsg({ type: "err", text: "La contraseña actual es requerida." })
    if (!newPassword) return setMsg({ type: "err", text: "La nueva contraseña es requerida." })
    if (!confirmPassword) return setMsg({ type: "err", text: "Confirmá la nueva contraseña." })
    if (newPassword.length < 8)
      return setMsg({ type: "err", text: "Debe tener al menos 8 caracteres." })
    if (newPassword !== confirmPassword)
      return setMsg({ type: "err", text: "Las contraseñas no coinciden." })

    setSaving(true)
    try {
      await changeMyPassword(currentPassword, newPassword)
      setMsg({ type: "ok", text: "Contraseña actualizada correctamente." })
      setMode("none")
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message ?? "No se pudo cambiar la contraseña." })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading)
    return <div className="text-muted-foreground">Cargando...</div>

  if (!user)
    return <div className="text-muted-foreground">No hay sesión.</div>

  return (
    <section className="space-y-12">

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >

        <Card className="rounded-2xl border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Mi cuenta
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-10">

            {/* Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Info label="Nombre" value={user.full_name} />
              <Info label="Email" value={user.email} />
              <Info label="Teléfono" value={user.phone} />
              <Info label="Dirección" value={user.direccion || "—"} />
              <Info label="Cédula" value={user.cedula || "—"} />
            </div>

            {/* Mensaje */}
            <AnimatePresence>
              {msg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-lg px-4 py-3 text-sm border ${
                    msg.type === "ok"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {msg.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={openEdit}
                className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-[1.02]"
              >
                Modificar datos
              </Button>

              <Button
                onClick={openPassword}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                Cambiar contraseña
              </Button>
            </div>

            {/* Formularios */}
            <AnimatePresence mode="wait">
              {mode === "edit" && (
                <FormWrapper key="edit" title="Modificar datos" onSubmit={handleSaveProfile}>
                  <Field label="Nombre">
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Teléfono">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                  <Field label="Dirección">
                    <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                  </Field>
                  <Field label="Cédula">
                    <Input value={cedula} onChange={(e) => setCedula(e.target.value)} />
                  </Field>
                  <FormButtons saving={saving} onCancel={closeForms} />
                </FormWrapper>
              )}

              {mode === "password" && (
                <FormWrapper key="password" title="Cambiar contraseña" onSubmit={handleChangePassword}>
                  <Field label="Contraseña actual">
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </Field>
                  <Field label="Nueva contraseña">
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </Field>
                  <Field label="Confirmar nueva contraseña">
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </Field>
                  <FormButtons saving={saving} onCancel={closeForms} />
                </FormWrapper>
              )}
            </AnimatePresence>

            <Button onClick={handleLogout} variant="destructive" className="w-full">
              Cerrar sesión
            </Button>

          </CardContent>
        </Card>

      </motion.div>
    </section>
  )
}

/* ---------- Subcomponentes ---------- */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

function FormWrapper({
  title,
  children,
  onSubmit,
}: {
  title: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={onSubmit}
      className="space-y-4 border border-border bg-muted/40 rounded-xl p-6 overflow-hidden"
    >
      <p className="font-semibold text-base">{title}</p>
      {children}
    </motion.form>
  )
}

function FormButtons({
  saving,
  onCancel,
}: {
  saving: boolean
  onCancel: () => void
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  )
}