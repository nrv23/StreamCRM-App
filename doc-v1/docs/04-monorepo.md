# 04 - Monorepo Structure

## Objetivo

El proyecto usará una estructura de monorepo para mantener organizados los servicios, paquetes compartidos, infraestructura, documentación y herramientas.

## Estructura propuesta

```text
streamcrm/
├── apps/
│   ├── api/
│   ├── worker/
│   ├── notification-service/
│   └── web/
├── packages/
│   ├── shared/
│   ├── database/
│   ├── logger/
│   ├── config/
│   ├── rabbitmq/
│   ├── redis/
│   └── contracts/
├── docker/
├── docs/
├── scripts/
├── tests/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## apps/api

Contiene la API principal.

Responsabilidades:

- REST API.
- Auth middleware.
- Validación de requests.
- Controladores.
- Casos de uso.
- Publicación de eventos.

## apps/worker

Contiene los consumers de RabbitMQ.

Responsabilidades:

- Procesar importaciones.
- Procesar campañas.
- Generar reportes.
- Ejecutar jobs programados.
- Manejar retry y DLQ.

## apps/notification-service

Responsabilidades:

- WebSocket server.
- Redis Pub/Sub.
- Envío de emails.
- Notificaciones internas.

## apps/web

Frontend en React.

Responsabilidades:

- Dashboard.
- Gestión de clientes.
- Gestión de campañas.
- Tickets.
- Reportes.
- Visualización de progreso en tiempo real.

## packages

### shared

Tipos comunes, helpers, errores, constants y utils.

### database

Pool de PostgreSQL, migraciones, repositories base, transaction manager y query helpers.

### logger

Logger estructurado, request ID, correlation ID y context logger.

### config

Variables de entorno y validación de configuración.

### rabbitmq

Connection manager, publisher, consumer base, retry helpers, DLQ helpers y event schemas.

### redis

Redis client, cache helpers, pub/sub, distributed locks y rate limit helpers.

### contracts

DTOs, event contracts, API response contracts y message payloads.
