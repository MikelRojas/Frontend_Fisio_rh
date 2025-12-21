import React, { useEffect, useState } from "react"
import CustomButton from "../components/Buttom"

const Home: React.FC = () => {
  const isAdmin = true

  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    setDescription(
      localStorage.getItem("description") ||
        "Bienvenidos! Fisioterapia RH ofrece el mejor servicio de la zona, con precio y horarios accesibles para ayudarte con tu rehabilitación, contracturas y demás."
    )

    setLocation(
      localStorage.getItem("location") ||
        "Hogar de Ancianos San Vicente de Paul, Ciudad Quesada, San Carlos, Costa Rica"
    )
  }, [])

  const saveDescription = (text: string) => {
    setDescription(text)
    localStorage.setItem("description", text)
  }

  const saveLocation = (text: string) => {
    setLocation(text)
    localStorage.setItem("location", text)
  }

  const handleEditLocation = () => {
    const text = prompt("Editar ubicación:", location)
    if (text) saveLocation(text)
  }

  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    location
  )}&output=embed`

  const mapsRedirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location
  )}`

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "rgba(62, 184, 185, 0.25)" }}
    >
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
            <CustomButton
              variant="secondary"
              onClick={() => {
                const text = prompt("Editar información:", description)
                if (text) saveDescription(text)
              }}
            >
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
        {/* MAPA + BOTONES */}
      <div className="md:col-span-1 space-y-3">
        {/* MAPA */}
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

        {/* BOTONES */}
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
          <h2 className="text-xl font-extrabold mb-2">
          Preguntas Frecuentes
        </h2>
        <p className="font-medium">
          </p>
        <p className="font-medium max-w-xl mx-auto">
          Si tienes dudas sobre nuestros servicios, nuestro asistente virtual
          puede ayudarte.
        </p>
        </div>

        {/* CONTACTO */}
        <div className="text-gray-900">
          <h2 className="text-xl font-extrabold mb-2">Contáctanos</h2>
          <p className="font-medium">Teléfono: +506 8888-8888</p>
          <p className="font-medium">
            Correo: contacto@fisioterapiarh.cr
          </p>
        </div>
      </section>

      {/* ---------------- CHATBOT ---------------- */}
      <button className="fixed bottom-6 right-6 bg-white rounded-full p-4 shadow-lg hover:scale-105 transition">
        🤖
      </button>
    </div>
  )
}

export default Home
