// src/pages/Account.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";

export default function Account() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!user) return <div className="p-6">No hay sesión.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><b>Nombre:</b> {user.full_name}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Rol:</b> {user.role}</div>
          <div><b>Activo:</b> {user.is_active ? "Sí" : "No"}</div>

          <Button variant="destructive" onClick={logout} className="mt-4">
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
