// src/pages/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import CustomButton from "../components/Buttom";
import { useAuth } from "../lib/AuthContext";
import { getSiteInfo, updateSiteInfo, getSiteLocation, updateSiteLocation } from "../lib/site";
import ChatbotWidget from "../components/ChatbotWidget";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// icons
import { MapPin, Clock, Mail, Phone, ExternalLink, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const Home: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  /* ---------------- GET AL CARGAR ---------------- */
  useEffect(() => {
    async function loadData() {
      try {
        const info = await getSiteInfo();
        setDescription(info.info);
      } catch {
        setDescription("Bienvenidos! Fisioterapia RH ofrece el mejor servicio de la zona");
      }

      try {
        const loc = await getSiteLocation();
        setLocation(loc.location);
      } catch {
        setLocation("Hogar de Ancianos San Vicente de Paul, Ciudad Quesada");
      }
    }

    loadData();
  }, []);

  /* ---------------- UPDATES ADMIN ---------------- */
  const handleEditInfo = async () => {
    const text = prompt("Editar información:", description);
    if (!text) return;

    try {
      await updateSiteInfo(text);
      setDescription(text);
      alert("Información actualizada");
    } catch {
      alert("No autorizado");
    }
  };

  const handleEditLocation = async () => {
    const text = prompt("Editar ubicación:", location);
    if (!text) return;

    try {
      await updateSiteLocation(text);
      setLocation(text);
      alert("Ubicación actualizada");
    } catch {
      alert("No autorizado");
    }
  };

  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  const mapsRedirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  // ✅ CONTACTO REAL
  const CONTACT_EMAIL = "lenismrh@hotmail.com";
  const CONTACT_PHONE = "+506 8748 4854";

  // ✅ WhatsApp (link directo al chat)
  const whatsappHref = useMemo(() => {
    // wa.me necesita número sin + ni espacios
    const phone = CONTACT_PHONE.replace(/[^\d]/g, ""); // deja solo dígitos
    return `https://wa.me/${phone}`;
  }, [CONTACT_PHONE]);

  // =========================
  // CARRUSEL (cards con imagen + descripción)
  // =========================
  const services = useMemo(
    () => [
      {
        img: "/images/img1.png",
        title: "Lesiones deportivas",
        desc: "Evaluación y tratamiento para recuperarte de forma segura, mejorar rendimiento y prevenir recaídas.",
      },
      {
        img: "/images/img2.jpg",
        title: "Patologías neurológicas y osteoarticulares",
        desc: "Abordaje integral para mejorar movilidad, fuerza y funcionalidad en condiciones neurológicas y articulares.",
      },
      {
        img: "/images/img3.jpg",
        title: "Ejercicios terapéuticos",
        desc: "Plan de ejercicios guiado y progresivo para fortalecer, estabilizar y recuperar movimiento con técnica correcta.",
      },
      {
        img: "/images/img4.png",
        title: "Rehabilitación pre y post operatoria",
        desc: "Preparación y recuperación para cirugías, enfocada en disminuir dolor, mejorar rango articular y volver a tus actividades.",
      },
      {
        img: "/images/img5.jpg",
        title: "Fisioterapia para el estrés",
        desc: "Técnicas para aliviar tensión muscular, mejorar postura y respiración, y reducir molestias asociadas al estrés.",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);

  const prev = () => setActive((p) => (p - 1 + services.length) % services.length);
  const next = () => setActive((p) => (p + 1) % services.length);

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-[#e7f7f7] via-white to-white">
      {/* ================= HERO ================= */}
      <section className="mx-auto max-w-[1280px] px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm border">
            <span className="text-sm font-semibold text-gray-800">Consultorio</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-700">Atención personalizada</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Fisioterapia RH
          </h1>

          <p className="text-base md:text-lg font-medium text-gray-800 max-w-xl">
            {description}
          </p>

          <div className="flex flex-wrap gap-3">
            {isAdmin && (
              <CustomButton variant="secondary" onClick={handleEditInfo}>
                Editar info
              </CustomButton>
            )}

            <Button asChild variant="outline" className="rounded-xl">
              <a href={mapsRedirectUrl} target="_blank" rel="noopener noreferrer">
                Ver ubicación <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <Button asChild className="rounded-xl">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Card className="rounded-2xl overflow-hidden shadow-lg w-full max-w-[560px]">
            <div className="relative">
              <img
                src="/images/fisioterapia.jpg"
                alt="Fisioterapia"
                className="w-full h-[320px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="rounded-xl bg-white/85 backdrop-blur px-4 py-3 border shadow-sm">
                  <p className="font-semibold text-gray-900">Recuperación • Prevención • Bienestar</p>
                  <p className="text-sm text-gray-700">
                    Tratamientos basados en evaluación y objetivos reales del paciente.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================= INFO ================= */}
      <section className="mx-auto max-w-[1280px] px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAPA */}
        <Card className="md:col-span-1 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-[300px] rounded-xl overflow-hidden border">
              <a href={mapsRedirectUrl} target="_blank" rel="noopener noreferrer">
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="100%"
                  className="border-0"
                  loading="lazy"
                  title="Mapa"
                />
              </a>
            </div>

            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => window.open(mapsRedirectUrl, "_blank")}
                >
                  Abrir en Google Maps
                </Button>

                <Button variant="secondary" className="rounded-xl" onClick={handleEditLocation}>
                  Editar ubicación
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UBICACIÓN + HORARIO + FAQ */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-900">
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg">Ubicación</h3>
              <p className="font-medium text-gray-800">{location}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" /> Horario
              </h3>
              <p className="font-medium text-gray-800">Lunes a viernes de 1:00 pm a 7:00 pm</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg">Preguntas frecuentes</h3>
              <p className="font-medium text-gray-800">
                Si tienes dudas sobre nuestros servicios, nuestro asistente virtual puede ayudarte.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CONTACTO */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Contáctanos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-900">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Teléfono</p>
                  <p className="font-medium text-gray-800">{CONTACT_PHONE}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Correo</p>
                  <a
                    className="font-medium text-gray-800 underline underline-offset-4"
                    href={`mailto:${CONTACT_EMAIL}`}
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Escribir por WhatsApp
                </a>
              </Button>

              <Button asChild variant="outline" className="rounded-xl">
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  Enviar correo
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ================= CARRUSEL DE SERVICIOS ================= */}
      <section className="mx-auto max-w-[1280px] px-6 pb-14">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Servicios principales
            </h2>
            <p className="text-gray-700 font-medium">
              Un vistazo rápido a lo que ofrecemos en el consultorio.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Carrusel tipo "cards" (sin librerías extra) */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {services.map((s, idx) => (
                <div key={idx} className="min-w-full">
                  <Card className="rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="relative">
                        <img
                          src={s.img}
                          alt={s.title}
                          className="w-full h-[260px] md:h-[320px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                      </div>

                      <CardContent className="p-6 md:p-8 flex flex-col justify-center gap-3">
                        <h3 className="text-2xl font-extrabold text-gray-900">{s.title}</h3>
                        <p className="text-gray-700 font-medium leading-relaxed">{s.desc}</p>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores */}
          <div className="mt-4 flex justify-center gap-2">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Ir al servicio ${i + 1}`}
                className={[
                  "h-2.5 w-2.5 rounded-full transition-all",
                  i === active ? "bg-gray-900 w-6" : "bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900">Fisioterapia RH</p>
            <p className="text-sm text-gray-600">
              Tel: {CONTACT_PHONE} •{" "}
              <a className="underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button asChild variant="outline" className="rounded-xl">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                Facebook <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <Button asChild variant="outline" className="rounded-xl">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                Instagram <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <Button asChild className="rounded-xl">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </footer>

      {/* ================= CHATBOT ================= */}
      <ChatbotWidget apiBaseUrl={API_URL}/>
    </div>
  );
};

export default Home;
