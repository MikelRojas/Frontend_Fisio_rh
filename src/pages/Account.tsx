import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";

export default function Account() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!user) return <div className="p-6">No hay sesión.</div>;

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      <Card className="w-full max-w-xl bg-white/90 backdrop-blur shadow-xl border border-white/40">
        <CardHeader>
          <CardTitle className="text-2xl">Mi cuenta</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="Nombre" value={user.full_name} />
            <Info label="Email" value={user.email} />
            <Info label="Rol" value={user.role} />
            <Info
              label="Estado"
              value={user.is_active ? "Activo" : "Inactivo"}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={logout}
              className="
                bg-[#2f8f90]
                hover:bg-[#277a7b]
                text-white
                font-semibold
              "
            >
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3 border border-white/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
