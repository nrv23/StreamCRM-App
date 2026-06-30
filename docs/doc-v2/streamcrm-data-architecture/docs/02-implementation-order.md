# 02 - Implementation Order

## Orden recomendado

### 1. Auth Service

Base para usuarios, roles y permisos.

### 2. Customer Service

Core del CRM.

### 3. Import Service

Permite demostrar streams y procesamiento masivo.

### 4. Campaign Service

Permite demostrar colas, eventos y workers.

### 5. Orchestrator Service

Permite sagas, jobs, DLQ y circuit breaker.

### 6. Ticket Service

Agrega flujo de atención al cliente.

### 7. Report Service

Permite exportaciones grandes con cursores y streams.

### 8. Notification Service

Notificaciones WebSocket/email y eventos.

## MVP sugerido

```text
auth-service
customer-service
import-service
campaign-service
orchestrator-service
```

## Razón

Con esos servicios ya se puede demostrar:

- Microservicios.
- PostgreSQL separado por servicio.
- RabbitMQ.
- Workers.
- Streams.
- Transactional Outbox.
- Sagas básicas.
- Dashboard de progreso.
