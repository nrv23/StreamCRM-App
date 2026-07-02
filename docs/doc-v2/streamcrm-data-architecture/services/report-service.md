# Report Service

## Base de datos

`report_db`

## Responsabilidad

Gestionar reportes síncronos y asíncronos, archivos generados y templates.

## Tablas

- report_jobs
- report_files
- report_templates
- report_read_models
- outbox_events

## SQL inicial

```sql
CREATE TABLE report_jobs (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE,

  report_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  filters JSONB NULL,
  requested_by_user_id INT NOT NULL,

  error_message TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_report_jobs_job_id
ON report_jobs(job_id);

CREATE INDEX idx_report_jobs_status
ON report_jobs(status);
CREATE TABLE report_files (
  id SERIAL PRIMARY KEY,

  report_job_id INT NOT NULL UNIQUE REFERENCES report_jobs(id),

  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,

  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_files_report_job_id
ON report_files(report_job_id);
CREATE TABLE report_templates (
  id SERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL UNIQUE,
  report_type VARCHAR(100) NOT NULL,

  columns JSONB NOT NULL,

  created_by_user_id INT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE report_read_models (
  id SERIAL PRIMARY KEY,

  source_entity VARCHAR(100) NOT NULL,
  source_id INT NOT NULL,

  data JSONB NOT NULL,

  updated_at TIMESTAMP NOT NULL DEFAULT now(),

  UNIQUE (source_entity, source_id)
);

CREATE INDEX idx_report_read_models_source
ON report_read_models(source_entity, source_id);
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
report_jobs 1:1 report_files
report_templates configura report_jobs
```

## Eventos publicados

- report.requested
- report.processing.started
- report.generated
- report.failed

## Eventos consumidos

- customer.created
- customer.updated
- campaign.completed
- ticket.closed

## APIs

```http
POST /api/v1/reports
GET  /api/v1/reports/:id
GET  /api/v1/reports/:id/download
GET  /api/v1/reports/templates
POST /api/v1/reports/templates
```

## Streams

```text
PostgreSQL cursor
 -> Readable Stream
 -> Transform to CSV
 -> File Writer / HTTP Response
```

## Cache Redis

```text
reports:job:{jobId}
reports:latest:{userId}
```

## Patrones

- CQRS básico con read models.
- Repository.
- Strategy para generadores de reporte.
- Factory para exportadores.
- Outbox.
