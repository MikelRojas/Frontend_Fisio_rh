import React, { useEffect, useRef, useState } from "react";
import CustomButton from "../components/Buttom";
import { useAuth } from "../lib/AuthContext";
import {
  getSiteInfo,
  updateSiteInfo,
  getSiteLocation,
  updateSiteLocation,
} from "../lib/site";
import ChatbotWidget from "../components/ChatbotWidget";
import CustomAlert from "@/components/Alert";

const Home: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  // ✅ Custom alerts tipo toast
  const [toast, setToast] = useState<null | {
    type: "success" | "error" | "warning" | "info";
    title: string;
    description?: string;
  }>(null);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description?: string
  ) => {
    setToast({ type, title, description });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  /* ---------------- GET AL CARGAR ---------------- */
  useEffect(() => {
    async function loadData() {
      try {
        const info = await getSiteInfo();
        // ✅ backend devuelve { info: "..." }
        setDescription(info.info ?? "");
      } catch {
        setDescription(
          "Bienvenidos! Fisioterapia RH ofrece el mejor servicio de la zona."
        );
      }

      try {
        const loc = await getSiteLocation();
        setLocation(loc.location ?? "");
      } catch {
        setLocation(
          "Hogar de Ancianos San Vicente de Paul, Ciudad Quesada, San Carlos"
        );
      }
    }

    loadData();
  }, []);

  /* ---------------- UPDATES ADMIN ---------------- */
  const handleEditInfo = async () => {
    const text = prompt("Editar información:", description);
    if (text === null) return;

    try {
      await updateSiteInfo(text);
      setDescription(text);
      showToast("success", "Información actualizada");
    } catch (e: any) {
      showToast("error", "No se pudo actualizar", e?.message ?? "No autorizado");
    }
  };

  const handleEditLocation = async () => {
    const text = prompt("Editar ubicación:", location);
    if (text === null) return;

    try {
      await updateSiteLocation(text);
      setLocation(text);
      showToast("success", "Ubicación actualizada");
    } catch (e: any) {
      showToast("error", "No se pudo actualizar", e?.message ?? "No autorizado");
    }
  };

  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    location
  )}&output=embed`;

  const mapsRedirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location
  )}`;

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
      {/* ✅ Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,680px)]">
          <CustomAlert
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(null)}
            className="shadow-lg"
          />
        </div>
      )}

      {/* ---------------- HERO ---------------- */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Fisioterapia RH
          </h1>

          <p className="text-base font-medium text-gray-900 mb-6 max-w-xl">
            {description}
          </p>

          {isAdmin && (
            <CustomButton variant="secondary" onClick={handleEditInfo}>
              Editar info
            </CustomButton>
          )}
        </div>

        <div className="flex justify-end">
          <img
            src="/images/fisioterapia.jpg"
            alt="Fisioterapia"
            className="rounded-xl shadow-lg max-h-[320px] object-cover"
          />
        </div>
      </section>

      {/* ---------------- INFO ---------------- */}
      <section className="mx-auto max-w-[1280px] px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAPA */}
        <div className="md:col-span-1 space-y-3">
          <div className="h-[300px] rounded-xl overflow-hidden shadow-lg">
            <a href={mapsRedirectUrl} target="_blank" rel="noopener noreferrer">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                className="border-0"
                loading="lazy"
              />
            </a>
          </div>

          {isAdmin && (
            <div className="flex gap-3 flex-wrap">
              <CustomButton
                variant="outline"
                onClick={() => window.open(mapsRedirectUrl, "_blank")}
              >
                Abrir en Google Maps
              </CustomButton>

              <CustomButton variant="secondary" onClick={handleEditLocation}>
                Editar ubicación
              </CustomButton>
            </div>
          )}
        </div>

        {/* UBICACIÓN */}
        <div className="text-gray-900">
          <h2 className="text-xl font-extrabold mb-2">Ubicación</h2>
          <p className="font-medium mb-2">{location}</p>
          <p className="font-medium">
            Horario: Lunes a viernes de 1:00 pm a 7:00 pm
          </p>
          <h2 className="text-xl font-extrabold mb-2">Preguntas Frecuentes</h2>
          <p className="font-medium max-w-xl mx-auto">
            Si tienes dudas sobre nuestros servicios, nuestro asistente virtual puede ayudarte.
          </p>
        </div>

        {/* CONTACTO */}
        <div className="text-gray-900">
          <h2 className="text-xl font-extrabold mb-2">Contáctanos</h2>
          <p className="font-medium">Teléfono: +506 8888-8888</p>
          <p className="font-medium">Correo: contacto@fisioterapiarh.cr</p>
        </div>
      </section>

      {/* ---------------- CHATBOT ---------------- */}
      <ChatbotWidget />
    </div>
  );
};

export default Home;
