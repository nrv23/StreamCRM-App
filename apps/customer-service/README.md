# 🏢 Customer Service - StreamCRM

Servicio centralizado para la gestión de clientes, notas, etiquetas, auditoría y cambios de estado en **StreamCRM**. Diseñado bajo principios de **Clean Architecture**, con persistencia transaccional en **PostgreSQL** y comunicación asíncrona mediante el patrón **Transactional Outbox** y **RabbitMQ**.

---

## 📌 Tabla de Contenidos
- [Características Principales](#-características-principales)
- [Arquitectura del Microservicio](#-arquitectura-del-microservicio)
- [Diagramas de Arquitectura y Flujos](#-diagramas-de-arquitectura-y-flujos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Patrones de Diseño Implementados](#-patrones-de-diseño-implementados)
- [Rutas y API Endpoints](#-rutas-y-api-endpoints)
- [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
- [Comandos y Ejecución](#-comandos-y-ejecución)

---

## ✨ Características Principales

- **Gestión Integral de Clientes**: Creación, actualización, búsqueda avanzada, cambio de estado y eliminación.
- **Notas y Auditoría**: Registro de notas asociadas a clientes e historial completo de auditoría (`AuditLogs`) e historial de estados (`CustomerStatusHistory`).
- **Etiquetado (Tags)**: Clasificación de clientes para mejor segmentación.
- **Transactional Outbox Pattern**: Garantía de consistencia eventual al registrar los eventos del dominio en la tabla `outbox_events` dentro de la misma transacción SQL antes de ser publicados a RabbitMQ.
- **Log Centralizado**: Integración con **Winston** y **Elasticsearch** para monitoreo y trazabilidad.

---

## 🏗️ Arquitectura del Microservicio

El proyecto sigue una estructura por capas (Layered / Clean Architecture):

```text
┌──────────────────────────────────────────────────────────┐
│                   HTTP / Presentation                    │
│   (Express Routes, Controllers, express-validator)       │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│            (Services, DTOs, Unit of Work)                │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                      Domain Layer                        │
│            (Entities, Interfaces, Enums)                 │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                Infrastructure & Data                     │
│    (PostgreSQL Repositories, Outbox Relay, RabbitMQ)     │
└──────────────────────────────────────────────────────────┘
```

---

## 📐 Diagramas de Arquitectura y Flujos

### 1. Diagrama de Arquitectura General

```mermaid
graph TD
    Client["🌐 Client / HTTP Request"] --> API["🛣️ Express Router / Middleware"]
    API --> Ctrl["🎛️ Controller Layer"]
    Ctrl --> Validator["✅ express-validator DTO"]
    Ctrl --> Service["⚙️ Customer / Note / Tag Service"]
    
    subgraph Persistence ["💾 Persistence & Outbox"]
        Service --> UOW["🔄 Unit of Work Transaction"]
        UOW --> DB[("🐘 PostgreSQL DB")]
        UOW --> Outbox[("📦 Outbox Events Table")]
    end

    subgraph Background ["⚡ Background Worker"]
        OutboxRelay["🔁 Outbox Relay Worker"] --> Outbox
        OutboxRelay --> Publisher["📡 RabbitEvent Publisher"]
        Publisher --> RabbitMQ[("🐇 RabbitMQ Exchange")]
    end

    subgraph Logging ["📊 Observability"]
        Service --> Logger["📝 Winston Logger"]
        Logger --> ES[("🔍 Elasticsearch")]
    end
```

### 2. Diagrama del Flujo Transactional Outbox

```mermaid
sequenceDiagram
    autonumber
    actor User as Cliente / Front-end
    participant Ctrl as Customer Controller
    participant Svc as Customer Service
    participant DB as PostgreSQL (Transaction)
    participant Relay as Outbox Background Relay
    participant Rabbit as RabbitMQ Exchange

    User->>Ctrl: POST /api/v1/customers (Crear Cliente)
    Ctrl->>Svc: createCustomer(dto)
    Note over Svc,DB: Inicia Transacción SQL
    Svc->>DB: INSERT INTO customers
    Svc->>DB: INSERT INTO audit_logs
    Svc->>DB: INSERT INTO outbox_events (Status: PENDING)
    Note over Svc,DB: Commit Transacción
    Svc-->>User: 201 Created (Respuesta inmediata)

    loop Polling cada N ms
        Relay->>DB: SELECT * FROM outbox_events WHERE status = 'PENDING'
        Relay->>Rabbit: Publish Event (customer.created)
        Relay->>DB: UPDATE outbox_events SET status = 'PUBLISHED'
    end
```

---

## 📂 Estructura del Proyecto

```text
src/
├── app.ts                  # Configuración de Express, middlewares y rutas
├── main.ts                 # Bootstrap de la aplicación y conexiones DB/Elasticsearch
├── background/             # Workers en segundo plano (Outbox Relay)
├── config/                 # Configuración de entorno (env, postgres, elasticsearch, rabbitmq)
├── controllers/            # Controladores HTTP (Customer, Note, Tag)
├── dto/                    # Objetos de Transferencia de Datos
├── entity/                 # Entidades del dominio (Customer, Note, Tag, AuditLogs, OutBoxEvent)
├── enum/                   # Enums del sistema (CustomerStatus, Events, etc.)
├── interfaces/             # Contratos e interfaces de repositories y servicios
├── publisher/              # Implementaciones de Event Publishers (RabbitMQ, Console)
├── repository/             # Implementación de acceso a datos con PostgreSQL
├── responses/              # Formateadores estandarizados de respuestas HTTP
├── routes/                 # Rutas de Express para cada recurso
├── services/               # Lógica de negocio principal (Customer, Note, Tag)
├── shared/                 # Middlewares globales, utilidades, logger y manejo de errores
└── validators/             # Reglas de validación con express-validator
```

---

## 🧩 Patrones de Diseño Implementados

1. **Transactional Outbox Pattern**: Evita fallos de consistencia entre la base de datos SQL y el broker de mensajes RabbitMQ.
2. **Repository Pattern**: Abstrae las consultas SQL tras interfaces para desacoplar el motor de base de datos de la lógica de negocio.
3. **Unit of Work**: Gestiona transacciones compuestas para garantizar la atomicidad en operaciones complejas (ej. Crear Cliente + Auditoría + Outbox Event).
4. **DTO (Data Transfer Object)**: Valida y transporta únicamente la información requerida en cada petición HTTP.

---

## 🛣️ Rutas y API Endpoints

### 👤 Clientes (`/api/v1/customers`)
- `POST /` - Crear un nuevo cliente.
- `GET /` - Listar clientes con paginación y filtros.
- `GET /:id` - Obtener detalle de cliente por ID.
- `PUT /:id` - Actualizar información del cliente.
- `PATCH /:id/status` - Cambiar estado del cliente (Active, Inactive, Blocked).
- `DELETE /:id` - Eliminar cliente.

### 📝 Notas (`/api/v1/notes`)
- `POST /` - Agregar una nota a un cliente.
- `GET /` - Consultar notas filtradas por cliente.
- `DELETE /:id` - Eliminar nota.

### 🏷️ Etiquetas (`/api/v1/tags`)
- `POST /` - Crear etiqueta.
- `GET /` - Listar etiquetas.
- `DELETE /:id` - Eliminar etiqueta.

### 🩺 Healthcheck
- `GET /health` - Estado de salud del microservicio.

---

## ⚙️ Configuración y Variables de Entorno

Crear un archivo `.env` en la raíz de `apps/customer-service/` con el siguiente contenido base:

```env
NODE_ENV=development
SERVER_PORT=3001

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=stream_crm_db

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

---

## 🚀 Comandos y Ejecución

```bash
# Navegar al microservicio
cd apps/customer-service

# Ejecutar en modo desarrollo
pnpm dev

# Compilar TypeScript a JavaScript
pnpm build

# Iniciar servidor compilado en producción
pnpm start

# Ejecutar tests unitarios e integración
pnpm test
```
