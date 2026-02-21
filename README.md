# Fisioterapia RH – Plataforma Web de Gestión Clínica

## Overview

Fisioterapia RH es una plataforma web **full-stack** desarrollada para digitalizar y optimizar la gestión clínica y administrativa de una clínica de fisioterapia.

Centraliza procesos como:

- Gestión de pacientes  
- Agenda inteligente con validación de conflictos  
- Solicitud y confirmación de citas  
- Expediente médico digital  
- Gestión de pagos y facturación  
- Control de acceso por roles  
- Asistente virtual  

El proyecto fue desarrollado bajo un enfoque formal de **Ingeniería de Software**.

---

## Arquitectura

Arquitectura cliente-servidor desacoplada:

- **Frontend:** React + TypeScript + shadcn/ui
- **Backend:** Python + Flask  
- **Base de datos:** PostgreSQL  
- **Comunicación:** REST API  
- **Autenticación:** basada en tokens  
- **Control de acceso:** por roles  


React → Flask API → PostgreSQL


---

## Seguridad y Acceso

- Registro, login y recuperación de contraseña  
- Contexto global de autenticación  
- Protección de rutas administrativas  
- Gestión segura de tokens  

Garantiza protección de datos clínicos y acceso restringido según el rol.

---

## Roles del Sistema

### Administrador
- Gestión de agenda y horarios  
- Confirmación de citas  
- Registro de tratamientos  
- Gestión de expedientes y facturación  

### Paciente
- Registro e inicio de sesión  
- Solicitud y consulta de citas  
- Acceso a expediente médico  
- Interacción con asistente virtual  


## Home – Landing Dinámica

El Home funciona como página pública del consultorio y panel editable para la administradora.  
Consume información dinámica desde la API y adapta funcionalidades según el rol del Paciente.

---

#### Paciente

- Visualización dinámica de información del consultorio.
- Mapa interactivo con Google Maps.
- Horario y datos de contacto.
- Acceso directo a WhatsApp y correo.
- Carrusel manual de servicios.
- Chatbot integrado.

[![Mira el video](https://img.youtube.com/vi/QgtuNl477kU/0.jpg)](https://youtu.be/QgtuNl477kU)

---

#### Admin

- Edición de descripción del consultorio.
- Edición de ubicación (actualiza mapa dinámicamente).
- Funcionalidades protegidas por control de acceso por rol.

<img src="public/images/readme/home_admin.png" alt="Home admin" width="480"/>


## Citas – Gestión Inteligente de Agenda

Módulo central del sistema donde pacientes solicitan citas y la administradora gestiona confirmaciones, pagos y estados.

Integra validación de disponibilidad en tiempo real, control de estado y lógica diferenciada por rol.

---

#### Paciente

- Creación de cita con descripción del caso.
- Selección obligatoria de 3 propuestas de horario según disponibilidad semanal.
- Consulta de estado (requested, confirmed, cancelled).
- Visualización de fecha asignada.
- Eliminación de cita (si aplica).
- Vista detallada con información completa.

[![Mira el video](https://img.youtube.com/vi/ahpfHCHXFKY/0.jpg)](https://youtu.be/ahpfHCHXFKY)

---

#### Admin

- Visualización de todas las citas del sistema.
- Filtros por estado, fecha y paciente.
- Confirmación de una propuesta específica.
- Cancelación con motivo.
- Asignación y edición desde Agenda.
- Gestión de estado de pago (toggle pagado/no pagado).
- Acceso a teléfono del paciente desde detalle.

[![Mira el video](https://img.youtube.com/vi/S1YaINKZ-RE/0.jpg)](https://youtu.be/S1YaINKZ-RE)

---

### Lógica Implementada

- Validación de 3 horarios obligatorios.
- Consulta dinámica de disponibilidad semanal.
- Estados controlados: `requested`, `confirmed`, `cancelled`.
- Manejo optimista de actualización de pago.
- Render condicional según rol.
- Modales controlados por estado global.
- Integración completa con REST API (Se envian emails de confirmacion).

## Agenda Profesional y Control de Disponibilidad

Módulo administrativo de planificación que permite gestionar la agenda clínica en vista mensual y diaria, con control de colisiones de horario y múltiples tipos de entradas.

Diseñado para centralizar citas, eventos y bloqueos en una sola interfaz interactiva.

---

#### Funcionalidades

- Vista mensual con navegación entre meses.
- Vista diaria tipo timeline con entradas detalladas.
- Creación rápida mediante botón flotante.
- Edición y eliminación desde modal.
- Validación automática de choques de horario.
- Integración directa con citas del sistema.

<img src="public/images/readme/planner1.png" alt="Home admin" width="480"/>

---

### Tipos de Entradas

**1️⃣ Evento**
- Eventos personalizados con rango horario.
- Título y nota opcional.
- Validación de hora inicio < hora fin.

**2️⃣ Cita Manual**
- Creación de cita sin pasar por solicitud del paciente.
- Asociación opcional a Paciente registrado.
- Duración fija de 1 hora.
- Sincronizada con módulo de citas.

**3️⃣ Bloqueo**
- Bloqueo de tiempo no disponible.
- Requiere motivo obligatorio.
- Previene asignación de citas en ese rango.

<img src="public/images/readme/planner2.png" alt="Home admin" width="480"/>

---

### Edición Avanzada

- Modificación de horario con validación.
- Cambio de Paciente en citas manuales.
- Eliminación con confirmación segura.
- Feedback visual ante errores o conflictos.

<img src="public/images/readme/planner3.png" alt="Home admin" width="480"/>

---

### Lógica Implementada

- Arquitectura basada en hooks personalizados (`usePlannerData`).
- Control de estado centralizado.
- Validación de rangos horarios en frontend y backend.
- Prevención de solapamiento de eventos.
- Render condicional por tipo (`event`, `appointment`, `block`).
- Sincronización automática tras cambios.

---

## Expedientes – Gestión Clínica Digital

Módulo central para la administración y consulta de expedientes médicos digitales, con control por rol, sincronización automática y manejo avanzado de diagnósticos.

Permite gestionar información clínica estructurada y mantener historial de tratamientos con estado vigente/no vigente.

---

#### Administrador

- Listado completo de expedientes.
- Búsqueda dinámica con debounce.
- Creación, edición y eliminación de expedientes.
- Vinculación opcional a usuario existente (por correo).
- Gestión de diagnósticos y tratamientos.
- Marcado dinámico de tratamiento vigente mediante `Switch`.
- Sincronización automática de citas completadas al expediente.

[![Mira el video](https://img.youtube.com/vi/aKs6vk8ue-w/0.jpg)](https://youtu.be/aKs6vk8ue-w)

---

#### Paciente

- Visualización de su expediente vinculado.
- Consulta de datos personales.
- Historial de diagnósticos y tratamientos.
- Indicador visual de tratamiento actual.

<img src="public/images/readme/expediente_user.png" alt="Home admin" width="480"/>

---

### Lógica Implementada

- Control de acceso basado en rol (`admin` / `patient`).
- Cache local de expedientes expandidos.
- Búsqueda con debounce para optimizar requests.
- Sincronización automática de citas completadas.
- Validaciones de formulario.
- Componentización avanzada con Dialogs reutilizables.