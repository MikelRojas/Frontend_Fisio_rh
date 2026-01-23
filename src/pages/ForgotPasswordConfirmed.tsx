// src/pages/ForgotPasswordConfirmed.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordConfirmed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}>
      <Card className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Tu correo ha sido confirmado</CardTitle>
          <p className="text-gray-500">Si tu correo existe se te enviará un correo</p>
        </CardHeader>

        <CardContent>
          <Button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-[#2f8f90] hover:bg-[#277a7b] text-white font-semibold py-6"
          >
            Volver al Inicio de Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
