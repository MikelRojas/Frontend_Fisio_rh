import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext";
import { register } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    if (mode === "register" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
        await register(fullName, email, password);
        setOk("Cuenta creada. Ahora iniciá sesión.");
        setMode("login");
        setPassword("");
      } else {
        await login(email, password);
        nav("/");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <Card className="w-full max-w-md bg-white/90 backdrop-blur shadow-xl border border-white/40">
        <CardHeader>
          <Button
            type="button"
            variant="ghost"
            onClick={() => nav(-1)}
            className="
              w-fit
              mb-2
              px-0
              text-[#3eb8b9]
              hover:bg-transparent
              hover:underline
              font-medium
            "
          >
            ← Volver
          </Button>
          <CardTitle>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Entrá con tu email y contraseña."
              : "Registrate con tu nombre completo, email y contraseña."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Nombre completo"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-muted-foreground hover:text-foreground
                  "
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {mode === "login" && (
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#3eb8b9] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {ok && (
              <Alert>
                <AlertDescription>{ok}</AlertDescription>
              </Alert>
            )}
            <Button
              className="
                w-full
                bg-[#3eb8b9]
                hover:bg-[#35a7a8]
                text-white
                font-semibold
              "
              disabled={loading}
            >
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>

            <div className="text-sm text-center">
              {mode === "login" ? (
                <button
                  type="button"
                  className="text-sm font-medium text-[#3eb8b9] hover:underline"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setOk(null);
                  }}
                >
                  ¿No tenés cuenta? Registrate
                </button>
              ) : (
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setOk(null);
                  }}
                >
                  Ya tengo cuenta
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
