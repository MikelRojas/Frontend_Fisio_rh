import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { changeMyPassword, updateMe } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

type Mode = "none" | "edit" | "password";

export default function Account() {
  const { user, logout, isLoading, refresh } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("none");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canShowCard = !isLoading && !!user;

  const initial = useMemo(() => {
    if (!user) return { fullName: "", email: "" };
    return { fullName: user.full_name ?? "", email: user.email ?? "" };
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  function openEdit() {
    setMsg(null);
    setMode("edit");
    setFullName(initial.fullName);
    setEmail(initial.email);
  }

  function openPassword() {
    setMsg(null);
    setMode("password");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function closeForms() {
    setMode("none");
    setMsg(null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (!name) return setMsg({ type: "err", text: "El nombre es requerido." });
    if (!mail) return setMsg({ type: "err", text: "El email es requerido." });
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setMsg({ type: "err", text: "Email inválido." });

    setSaving(true);
    try {
      await updateMe(name, mail);
      await refresh(); // refresca el user del contexto
      setMsg({ type: "ok", text: "Datos actualizados correctamente." });
      setMode("none");
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message ?? "No se pudo actualizar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!currentPassword) return setMsg({ type: "err", text: "La contraseña actual es requerida." });
    if (!newPassword) return setMsg({ type: "err", text: "La nueva contraseña es requerida." });
    if (!confirmPassword) return setMsg({ type: "err", text: "Confirmá la nueva contraseña." });

    if (newPassword.length < 8)
      return setMsg({ type: "err", text: "La nueva contraseña debe tener al menos 8 caracteres." });

    if (newPassword === currentPassword)
      return setMsg({ type: "err", text: "La nueva contraseña no puede ser igual a la actual." });

    if (newPassword !== confirmPassword)
      return setMsg({ type: "err", text: "La confirmación no coincide." });

    setSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setMsg({ type: "ok", text: "Contraseña actualizada correctamente." });
      setMode("none");
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message ?? "No se pudo cambiar la contraseña." });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!user) return <div className="p-6">No hay sesión.</div>;

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <Card className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-white/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl font-bold">Mi cuenta</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info principal (como la imagen) */}
          <div className="space-y-2 text-[15px]">
            <p className="font-semibold">
              Nombre: <span className="font-normal">{user.full_name}</span>
            </p>
            <p className="font-semibold">
              Email: <span className="font-normal">{user.email}</span>
            </p>
          </div>

          {/* Mensajito */}
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

          {/* Botones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={openEdit}
              className="bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold rounded-lg"
            >
              Modificar datos
            </Button>

            <Button
              type="button"
              onClick={openPassword}
              className="bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold rounded-lg"
            >
              Cambiar Contraseña
            </Button>
          </div>

          {/* Formularios condicionales */}
          {mode === "edit" && (
            <form onSubmit={handleSaveProfile} className="rounded-xl border bg-white/70 p-4 space-y-4">
              <p className="font-semibold">Modificar datos</p>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeForms} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          )}

          {mode === "password" && (
            <form
              onSubmit={handleChangePassword}
              className="rounded-xl border bg-white/70 p-4 space-y-4"
            >
              <p className="font-semibold">Cambiar contraseña</p>

              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña actual</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="********"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={closeForms} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold"
                >
                  {saving ? "Cambiando..." : "Actualizar"}
                </Button>
              </div>
            </form>
          )}

          {/* Cerrar sesión abajo */}
          <div className="pt-2">
            <Button
              onClick={handleLogout}
              className="w-full bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold rounded-lg py-6"
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
