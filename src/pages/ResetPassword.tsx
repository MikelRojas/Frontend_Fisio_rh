import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const email = useMemo(() => (params.get("email") || "").trim().toLowerCase(), [params]);
  const token = useMemo(() => (params.get("token") || "").trim(), [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email || !token) {
      return setMsg({ type: "err", text: "El enlace no es válido o está incompleto." });
    }

    if (password.length < 8) {
      return setMsg({ type: "err", text: "Mínimo 8 caracteres." });
    }
    if (password !== confirm) {
      return setMsg({ type: "err", text: "La confirmación no coincide." });
    }

    setLoading(true);
    try {
      await resetPassword(email, token, password);
      setMsg({ type: "ok", text: "Contraseña actualizada. Ya podés iniciar sesión." });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo cambiar la contraseña." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Cambiar contraseña</CardTitle>
          <p className="text-gray-500">Escribe una nueva contraseña con estas reglas:</p>
          <p className="text-gray-500">Mínimo 8 caracteres</p>
          <p className="text-gray-500">Diferente a las contraseñas anteriores</p>
        </CardHeader>

        <CardContent className="space-y-5">
          {msg && (
            <div
              className={[
                "rounded-lg px-3 py-2 text-sm border",
                msg.type === "ok"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700",
              ].join(" ")}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Confirma la contraseña</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold py-6"
            >
              {loading ? "Cambiando..." : "Cambiar Contrase;a"}
            </Button>
          </form>

          <div className="text-center">
            <Link className="underline text-gray-800" to="/login">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
