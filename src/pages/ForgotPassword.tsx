// src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const mail = email.trim().toLowerCase();
    if (!mail) return setErr("Ingresá tu correo.");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setErr("Correo inválido.");

    setLoading(true);
    try {
      await forgotPassword(mail);
      navigate("/forgot-password/confirmed", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Confirma tu email</CardTitle>
          <p className="text-gray-500">Coloca tu correo electrónico para recuperar tu contraseña</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold py-6"
            >
              {loading ? "Enviando..." : "Confirmar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
