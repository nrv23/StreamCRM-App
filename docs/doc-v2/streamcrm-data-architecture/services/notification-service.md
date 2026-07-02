# Notification Service

## Base de datos

`notification_db`

## Responsabilidad

Gestionar notificaciones internas, WebSocket, email y entregas.

## Tablas

- notifications
- notification_deliveries
- notification_templates
- outbox_events

## SQL inicial

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  external_id UUID NOT NULL UNIQUE,

  user_id INT NULL,

  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,

  type VARCHAR(50) NOT NULL DEFAULT 'info',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  metadata JSONB NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  read_at TIMESTAMP NULL,

  CHECK (type IN ('info', 'success', 'warning', 'error')),
  CHECK (status IN ('pending', 'sent', 'read', 'failed'))
);

CREATE INDEX idx_notifications_external_id
ON notifications(external_id);

CREATE INDEX idx_notifications_user_status
ON notifications(user_id, status);
CREATE TABLE notification_deliveries (
  id SERIAL PRIMARY KEY,

  notification_id INT NOT NULL REFERENCES notifications(id),

  channel VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  error_message TEXT NULL,

  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (channel IN ('websocket', 'email')),
  CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX idx_notification_deliveries_notification_id
ON notification_deliveries(notification_id);
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL UNIQUE,

  channel VARCHAR(50) NOT NULL,

  subject VARCHAR(255) NULL,
  body TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (channel IN ('websocket', 'email'))
);
```


## Transactional Outbox

Cada servicio tiene su propia tabla `outbox_events`.

```sql
CREATE TABLE outbox_events (
  id SERIAL PRIMARY KEY,

  event_id UUID NOT NULL UNIQUE,

  event_name VARCHAR(150) NOT NULL,

  aggregate_id INT NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,

  payload JSONB NOT NULL,
  headers JSONB NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  published_at TIMESTAMP NULL,

  CHECK (status IN ('pending', 'published', 'failed'))
);

CREATE INDEX idx_outbox_events_status_created_at
ON outbox_events(status, created_at);
```

### Propósito

Evitar el problema de guardar datos en PostgreSQL pero fallar al publicar el evento en RabbitMQ.

Flujo recomendado:

```text
BEGIN
  INSERT/UPDATE entidad de negocio
  INSERT outbox_events
COMMIT

Outbox Publisher
  -> lee eventos pending
  -> publica en RabbitMQ
  -> marca published
```


## Relaciones

```text
notifications 1:N notification_deliveries
```

## Eventos publicados

- notification.created
- notification.sent
- notification.failed
- notification.read

## Eventos consumidos

- campaign.completed
- campaign.failed
- report.generated
- report.failed
- ticket.assigned
- import.customer.batch.completed

## APIs

```http
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
GET  /api/v1/notifications/unread-count
```

## Redis Pub/Sub

Canales:

```text
ws:user:{userId}
ws:campaign:{campaignId}
ws:import:{batchId}
```

## Circuit Breaker

Aplicable a:

- Email provider.
- WebSocket gateway si se separa.
- External messaging APIs.

Estados:

- closed.
- open.
- half_open.

## Patrones

- Observer.
- Circuit Breaker.
- Retry.
- Outbox.
- Pub/Sub.
