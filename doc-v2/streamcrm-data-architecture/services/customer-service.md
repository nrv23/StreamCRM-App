# Customer Service

## Base de datos

`customer_db`

## Responsabilidad

Gestionar clientes, tags, notas, historial de estados y auditoría.

## Tablas

- customers
- tags
- customer_tags
- customer_notes
- customer_status_history
- audit_logs
- processed_events
- outbox_events

## SQL inicial

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  country VARCHAR(80) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_by UUID NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE UNIQUE INDEX idx_customers_email_unique
ON customers(email)
WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_country_status ON customers(country, status);
CREATE INDEX idx_customers_created_at ON customers(created_at);

CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE customer_tags (
  customer_id UUID NOT NULL REFERENCES customers(id),
  tag_id UUID NOT NULL REFERENCES tags(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

CREATE TABLE customer_notes (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE customer_status_history (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by UUID NULL,
  old_values JSONB NULL,
  new_values JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE processed_events (
  event_id UUID PRIMARY KEY,
  event_name VARCHAR(150) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT now()
);
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
customers N:M tags
customers 1:N customer_notes
customers 1:N customer_status_history
```

## Eventos publicados

- customer.created
- customer.updated
- customer.deleted
- customer.tag.added
- customer.status.changed
- customer.import.row.processed

## Eventos consumidos

- import.customer.row.validated
- import.customer.batch.completed

## APIs

```http
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
POST   /api/v1/customers/:id/notes
GET    /api/v1/customers/:id/history
```

## Cache Redis

```text
customer:{customerId}
customers:stats:status
customers:stats:country
customers:summary
```

## Patrones

- Repository.
- Specification para filtros.
- Cache Aside.
- Observer/EventEmitter para eventos de dominio.
- Unit of Work para transacción + outbox.
