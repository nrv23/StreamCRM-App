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
  id SERIAL PRIMARY KEY,
  external_id UUID NOT NULL UNIQUE,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  country VARCHAR(80) NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'active',

  created_by_user_id INT NULL,

  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE UNIQUE INDEX idx_customers_email_unique
ON customers(email)
WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_customers_external_id ON customers(external_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_country_status ON customers(country, status);
CREATE INDEX idx_customers_created_at ON customers(created_at);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE customer_tags (
  customer_id INT NOT NULL REFERENCES customers(id),
  tag_id INT NOT NULL REFERENCES tags(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id)
);

CREATE TABLE customer_notes (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  user_id INT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_notes_customer_id
ON customer_notes(customer_id);

CREATE TABLE customer_status_history (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  changed_by_user_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (new_status IN ('active', 'inactive', 'blocked'))
);

CREATE INDEX idx_customer_status_history_customer_id
ON customer_status_history(customer_id);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_by_user_id INT NULL,
  old_values JSONB NULL,
  new_values JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);

CREATE TABLE processed_events (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  event_name VARCHAR(150) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT now()
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
