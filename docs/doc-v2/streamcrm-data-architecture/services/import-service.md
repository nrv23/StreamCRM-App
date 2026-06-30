# Import Service

## Base de datos

`import_db`

## Responsabilidad

Gestionar cargas masivas de archivos, validación por streams, progreso y errores.

## Tablas

- import_batches
- import_files
- import_rows
- import_errors
- outbox_events

## SQL inicial

```sql
CREATE TABLE import_batches (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  total_rows INT NOT NULL DEFAULT 0,
  success_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  CHECK (type IN ('customers')),
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE import_files (
  id UUID PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES import_batches(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NULL,
  checksum VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE import_rows (
  id UUID PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES import_batches(id),
  row_number INT NOT NULL,
  raw_data JSONB NOT NULL,
  normalized_data JSONB NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  processed_at TIMESTAMP NULL,
  UNIQUE (import_batch_id, row_number)
);

CREATE TABLE import_errors (
  id UUID PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES import_batches(id),
  row_number INT NULL,
  field_name VARCHAR(100) NULL,
  error_code VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_rows_batch_status
ON import_rows(import_batch_id, status);

CREATE INDEX idx_import_errors_batch
ON import_errors(import_batch_id);
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
import_batches 1:1 import_files
import_batches 1:N import_rows
import_batches 1:N import_errors
```

## Eventos publicados

- import.customer.batch.created
- import.customer.batch.started
- import.customer.row.validated
- import.customer.row.invalid
- import.customer.batch.completed
- import.customer.batch.failed

## Eventos consumidos

- import.customer.batch.requested

## APIs

```http
POST /api/v1/imports/customers
GET  /api/v1/imports/:id
GET  /api/v1/imports/:id/errors
POST /api/v1/imports/:id/cancel
```

## Streams

```text
Upload Stream
  -> CSV Parser
  -> Validation Transform
  -> Batch Transform
  -> RabbitMQ Publisher
```

## Cache Redis

```text
import:progress:{batchId}
```

## Patrones

- Pipeline.
- Producer/Consumer.
- Strategy para validadores de archivo.
- Factory para parsers.
- Outbox.
- Idempotent Consumer.
