import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/AuthContext"
import { register } from "@/lib/auth"
import { Eye, EyeOff } from "lucide-react"

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [direccion, setDireccion] = useState("")
  const [cedula, setCedula] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)
    setLoading(true)

    if (mode === "register" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    if (mode === "register") {
      if (!fullName.trim()) return fail("El nombre es obligatorio")
      if (!phone.trim()) return fail("El teléfono es obligatorio")
      if (!direccion.trim()) return fail("La dirección es obligatoria")
      if (!cedula.trim()) return fail("La cédula es obligatoria")
    }

    try {
      if (mode === "register") {
        await register(fullName, email, password, phone, direccion, cedula)
        setOk("Cuenta creada correctamente. Ahora iniciá sesión.")
        setMode("login")
        setPassword("")
        setFullName("")
        setPhone("")
        setDireccion("")
        setCedula("")
      } else {
        await login(email, password)
        nav("/")
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  function fail(message: string) {
    setError(message)
    setLoading(false)
  }

  return (
    <section className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 sm:px-6">

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl"
      >

        <Card className="rounded-2xl border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">

          <CardHeader className="space-y-2">

            <Button
              type="button"
              variant="ghost"
              onClick={() => nav(-1)}
              className="w-fit px-0 text-primary hover:bg-transparent hover:underline"
            >
              ← Volver
            </Button>

            <CardTitle className="text-2xl font-semibold tracking-tight">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </CardTitle>

            <CardDescription>
              {mode === "login"
                ? "Ingresá con tu email y contraseña."
                : "Completá tus datos para crear una cuenta."}
            </CardDescription>

          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">

              <AnimatePresence mode="wait">

                {mode === "register" && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <Field label="Nombre completo">
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
                  </motion.div>
                )}

              </AnimatePresence>

              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field label="Contraseña">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              {mode === "login" && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {ok && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Alert>
                      <AlertDescription>{ok}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-primary hover:bg-primary/90 transition-all duration-300"
                disabled={loading}
              >
                {loading
                  ? "Procesando..."
                  : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}
              </Button>

              <div className="text-sm text-center">
                {mode === "login" ? (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      setMode("register")
                      setError(null)
                      setOk(null)
                    }}
                  >
                    ¿No tenés cuenta? Registrate
                  </button>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      setMode("login")
                      setError(null)
                      setOk(null)
                    }}
                  >
                    Ya tengo cuenta
                  </button>
                )}
              </div>

            </form>
          </CardContent>
        </Card>

      </motion.div>
    </section>
  )
}

/* ---------- Subcomponent ---------- */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}