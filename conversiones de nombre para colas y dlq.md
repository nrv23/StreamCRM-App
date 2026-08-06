# Convención de nombres para RabbitMQ (Stream CRM)

Para mantener una arquitectura limpia y fácil de entender, se recomienda seguir una convención consistente para Exchanges, Queues, Dead Letter Exchanges (DLX) y Dead Letter Queues (DLQ).

## Exchange Principal

El exchange principal es el punto de entrada de todos los eventos del sistema.

```text
stream-crm.topic
```

Es de tipo **Topic Exchange**, ya que permite enrutar eventos mediante Routing Keys.

Ejemplos de Routing Keys:

```text
customer.created
customer.updated
customer.deleted

campaign.created
campaign.executed

ticket.created
ticket.closed
```

---

## Dead Letter Exchange (DLX)

El Dead Letter Exchange recibe automáticamente los mensajes rechazados (`reject`) o enviados con `nack(..., false, false)` por los consumidores.

Se recomienda utilizar un único DLX para todo el sistema.

```text
stream-crm.dlx
```

El DLX también puede ser de tipo **Topic**, permitiendo enrutar los mensajes muertos según su Routing Key.

---

## Queues

Cada microservicio posee su propia cola principal.

Ejemplo:

```text
customer-service
notification-service
report-service
campaign-service
ticket-service
```

---

## Dead Letter Queues (DLQ)

Cada microservicio debe poseer su propia Dead Letter Queue.

Se recomienda utilizar la siguiente convención:

```text
customer-service.dlq
notification-service.dlq
report-service.dlq
campaign-service.dlq
ticket-service.dlq
```

La extensión `.dlq` identifica inmediatamente que se trata de una cola de mensajes muertos.

---

## Topología recomendada

```text
                    stream-crm.topic
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
customer-service   notification-service   report-service
        │                  │                  │
        │ reject/nack      │ reject/nack      │ reject/nack
        ▼                  ▼                  ▼
                   stream-crm.dlx
        ┌──────────────────┼──────────────────┐
        │                  │                  │
customer-service.dlq  notification-service.dlq  report-service.dlq
```

---

## Convención utilizada

### Exchanges

```text
stream-crm.topic
stream-crm.dlx
```

### Queues

```text
customer-service
notification-service
campaign-service
report-service
ticket-service
```

### Dead Letter Queues

```text
customer-service.dlq
notification-service.dlq
campaign-service.dlq
report-service.dlq
ticket-service.dlq
```

---

## Ventajas

- Nombres fáciles de identificar.
- Arquitectura consistente entre todos los microservicios.
- Escalable cuando el sistema crezca.
- Facilita la administración desde RabbitMQ Management.
- Facilita el monitoreo y la observabilidad.
- Cualquier ingeniero puede identificar inmediatamente qué recurso pertenece a cada servicio.

---

## Recomendación

Mantener una única convención para todo el proyecto:

- `.topic` → Exchange principal.
- `.dlx` → Dead Letter Exchange.
- `.dlq` → Dead Letter Queue.

Seguir esta convención desde el inicio evita confusión cuando el sistema crezca y existan decenas de exchanges y colas distribuidas entre múltiples microservicios.