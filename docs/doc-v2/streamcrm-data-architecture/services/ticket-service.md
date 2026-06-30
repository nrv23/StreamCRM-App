# Ticket Service

## Base de datos

`ticket_db`

## Responsabilidad

Gestionar tickets de soporte, asignaciones, comentarios e historial.

## Tablas

- tickets
- ticket_comments
- ticket_assignments
- ticket_status_history
- outbox_events

## SQL inicial

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  customer_name_snapshot VARCHAR(200) NULL,
  customer_email_snapshot VARCHAR(255) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  priority VARCHAR(30) NOT NULL DEFAULT 'medium',
  created_by UUID NOT NULL,
  assigned_to UUID NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  closed_at TIMESTAMP NULL,
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ticket_assignments (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
```


## Transactional Outbox

Cada servicio tiene su propia tabla `outbox_events`.

```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  event_name VARCHAR(150) NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  published_at TIMESTAMP NULL
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
tickets 1:N ticket_comments
tickets 1:N ticket_assignments
tickets 1:N ticket_status_history
```

## Eventos publicados

- ticket.created
- ticket.assigned
- ticket.comment.created
- ticket.status.changed
- ticket.closed

## Eventos consumidos

- customer.updated

## APIs

```http
POST /api/v1/tickets
GET  /api/v1/tickets
GET  /api/v1/tickets/:id
PATCH /api/v1/tickets/:id
POST /api/v1/tickets/:id/comments
POST /api/v1/tickets/:id/assign
POST /api/v1/tickets/:id/close
```

## Cache Redis

```text
tickets:stats
tickets:agent:{userId}
```

## Patrones

- Repository.
- State Machine.
- Observer.
- Outbox.
