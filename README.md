<h1 align="center">🩺 Fisioterapia RH</h1>
<h3 align="center">Plataforma Web de Gestión Clínica</h3>

<p align="center">
  Sistema full-stack para digitalizar y centralizar la gestión clínica y administrativa.
</p>

<p align="center">
  <img src="public/images/readme/img1.png" width="800"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Backend-Flask-black?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Auth-Token%20Based-green?style=for-the-badge"/>
</p>

---

# 🧠 Overview

Plataforma desarrollada bajo un enfoque formal de Ingeniería de Software que integra:

- 🧑‍⚕️ Gestión de pacientes  
- 📅 Agenda inteligente con validación de conflictos  
- 📩 Solicitud y confirmación de citas  
- 📂 Expediente médico digital  
- 💳 Pagos y facturación  
- 🔐 Control de acceso por roles  
- 🤖 Asistente virtual  

---

# 🏗 Arquitectura

<p align="center">
React → Flask API → PostgreSQL
</p>

| Capa | Tecnología |
|------|------------|
| Frontend | React + TypeScript + shadcn/ui |
| Backend | Python + Flask |
| Base de Datos | PostgreSQL |
| Comunicación | REST API |
| Autenticación | Token Based |
| Autorización | Roles (admin / patient) |

---

# 🔐 Seguridad

- Registro, login y recuperación de contraseña  
- Contexto global de autenticación  
- Protección de rutas administrativas  
- Gestión segura de tokens  

Garantiza acceso restringido y protección de datos clínicos.

---

# 👥 Roles del Sistema

## 👩‍⚕️ Administrador
- Gestión de agenda y confirmación de citas  
- Administración de expedientes  
- Gestión de facturación  

## 🧑 Paciente
- Solicitud y consulta de citas  
- Acceso a expediente médico  
- Interacción con asistente virtual  

---

# 🏠 Home – Landing Dinámica

Página pública del consultorio y panel editable para la administradora.

---

## 🧑 Paciente

- Información dinámica del consultorio  
- Google Maps integrado  
- Contacto directo (WhatsApp / Email)  
- Carrusel de servicios  
- Chatbot integrado  

<p align="center">
  <a href="https://youtu.be/QgtuNl477kU">
    <img src="https://img.youtube.com/vi/QgtuNl477kU/0.jpg" width="600"/>
  </a>
</p>

---

## 👩‍⚕️ Admin

- Edición de descripción  
- Edición dinámica de ubicación  
- Control de acceso por rol  

<p align="center">
  <img src="public/images/readme/home_admin.png" width="600"/>
</p>

---

# 📅 Gestión Inteligente de Citas

Sistema central de solicitudes con validación en tiempo real.

---

## 🧑 Paciente

- Selección obligatoria de 3 horarios disponibles  
- Seguimiento de estado (`requested`, `confirmed`, `cancelled`)  
- Eliminación de cita  
- Vista detallada  

<p align="center">
  <a href="https://youtu.be/ahpfHCHXFKY">
    <img src="https://img.youtube.com/vi/ahpfHCHXFKY/0.jpg" width="600"/>
  </a>
</p>

---

## 👩‍⚕️ Admin

- Filtros por estado y fecha  
- Confirmación de propuesta específica  
- Cancelación con motivo  
- Control de pago  
- Acceso rápido a contacto  

<p align="center">
  <a href="https://youtu.be/S1YaINKZ-RE">
    <img src="https://img.youtube.com/vi/S1YaINKZ-RE/0.jpg" width="600"/>
  </a>
</p>

---

# 🗓 Agenda Profesional

Vista mensual y diaria tipo timeline con validación de colisiones.

<p align="center">
  <img src="public/images/readme/planner1.png" width="600"/>
</p>

## Tipos de entradas

### 1️⃣ Evento
- Título + nota opcional  
- Validación inicio < fin  

### 2️⃣ Cita Manual
- Asociación a paciente  
- Duración fija  
- Sincronizada con módulo de citas  

### 3️⃣ Bloqueo
- Motivo obligatorio  
- Previene asignación de citas  

<p align="center">
  <img src="public/images/readme/planner2.png" width="600"/>
</p>

<p align="center">
  <img src="public/images/readme/planner3.png" width="600"/>
</p>

---

# 📂 Expedientes Digitales

Gestión clínica estructurada con historial y control de tratamiento vigente.

---

## 👩‍⚕️ Administrador

- CRUD completo de expedientes  
- Vinculación por correo  
- Gestión de diagnósticos  
- Tratamiento vigente con Switch  
- Sincronización automática de citas  

<p align="center">
  <a href="https://youtu.be/aKs6vk8ue-w">
    <img src="https://img.youtube.com/vi/aKs6vk8ue-w/0.jpg" width="600"/>
  </a>
</p>

---

## 🧑 Paciente

- Visualización de expediente  
- Historial clínico  
- Indicador de tratamiento activo  

<p align="center">
  <img src="public/images/readme/expediente_user.png" width="600"/>
</p>

---

# ⚙️ Lógica Técnica Destacada

- Arquitectura basada en hooks personalizados  
- Validación frontend + backend  
- Prevención de solapamientos  
- Render condicional por rol  
- Manejo optimista de estado  
- Sincronización automática con REST API  