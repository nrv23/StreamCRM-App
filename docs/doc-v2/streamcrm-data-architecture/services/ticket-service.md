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
  id SERIAL PRIMARY KEY,

  customer_id INT NOT NULL,

  customer_name_snapshot VARCHAR(200) NULL,
  customer_email_snapshot VARCHAR(255) NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'open',
  priority VARCHAR(30) NOT NULL DEFAULT 'medium',

  created_by_user_id INT NOT NULL,
  assigned_to_user_id INT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  closed_at TIMESTAMP NULL,

  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX idx_tickets_status
ON tickets(status);

CREATE INDEX idx_tickets_assigned_to
ON tickets(assigned_to_user_id);

CREATE INDEX idx_tickets_customer_id
ON tickets(customer_id);
CREATE TABLE ticket_comments (
  id SERIAL PRIMARY KEY,

  ticket_id INT NOT NULL REFERENCES tickets(id),

  user_id INT NOT NULL,

  comment TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket_id
ON ticket_comments(ticket_id);
CREATE TABLE ticket_assignments (
  id SERIAL PRIMARY KEY,

  ticket_id INT NOT NULL REFERENCES tickets(id),

  assigned_to_user_id INT NOT NULL,
  assigned_by_user_id INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_assignments_ticket_id
ON ticket_assignments(ticket_id);
CREATE TABLE ticket_status_history (
  id SERIAL PRIMARY KEY,

  ticket_id INT NOT NULL REFERENCES tickets(id),

  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,

  changed_by_user_id INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (new_status IN ('open', 'in_progress', 'resolved', 'closed'))
);

CREATE INDEX idx_ticket_status_history_ticket_id
ON ticket_status_history(ticket_id);
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

CREATE INDEX idx_outbox_events_event_id
ON outbox_events(event_id);

CREATE INDEX idx_outbox_events_aggregate
ON outbox_events(aggregate_type, aggregate_id);
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
