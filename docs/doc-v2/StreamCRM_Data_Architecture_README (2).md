# StreamCRM - Data Architecture

Documentación de arquitectura de datos para StreamCRM, un CRM distribuido orientado a campañas, atención al cliente, importaciones masivas, reportes por streams, eventos, sagas y resiliencia.

## Principio central

Cada microservicio es dueño de su propia base de datos.

Ningún microservicio consulta directamente las tablas de otro microservicio. La integración se realiza por:

- APIs internas.
- Eventos con RabbitMQ.
- Snapshots de datos.
- Transactional Outbox.
- Sagas para procesos distribuidos.

## Microservicios documentados

```text
auth-service
customer-service
import-service
campaign-service
ticket-service
report-service
notification-service
orchestrator-service
```

## Estructura

```text
streamcrm-data-architecture/
├── README.md
├── docs/
│   ├── 01-data-architecture-principles.md
│   ├── 02-implementation-order.md
│   └── 03-mvp-vs-enterprise.md
├── services/
│   ├── auth-service.md
│   ├── customer-service.md
│   ├── import-service.md
│   ├── campaign-service.md
│   ├── ticket-service.md
│   ├── report-service.md
│   ├── notification-service.md
│   └── orchestrator-service.md
├── events/
│   ├── rabbitmq-events.md
│   ├── exchanges-queues-dlq.md
│   └── saga-flows.md
├── api/
│   └── api-summary.md
├── diagrams/
│   └── database-boundaries.md
├── infra/
│   ├── redis-cache-strategy.md
│   └── observability-data.md
└── roadmap/
    └── roadmap.md
```

## Objetivo

Servir como plano maestro para crear bases de datos, entidades, APIs, eventos y relaciones de StreamCRM.


---

# 01 - Data Architecture Principles

## Database per Service

Cada servicio tiene su propia base de datos.

Ejemplo:

```text
auth-service        -> auth_db
customer-service    -> customer_db
campaign-service    -> campaign_db
ticket-service      -> ticket_db
import-service      -> import_db
report-service      -> report_db
notification-service-> notification_db
orchestrator-service-> orchestrator_db
```

## No Cross-Service Joins

No se permiten joins entre bases de datos de microservicios distintos.

Incorrecto:

```sql
SELECT *
FROM campaign_db.campaigns c
JOIN customer_db.customers cu ON cu.id = c.customer_id;
```

Correcto:

- Usar eventos.
- Usar APIs.
- Guardar snapshots.
- Crear read models.

## Snapshots

Cuando un servicio necesita datos de otro, guarda un snapshot mínimo.

Ejemplo en `campaign_recipients`:

```text
customer_id
customer_name_snapshot
customer_email_snapshot
customer_phone_snapshot
```

Esto permite que Campaign Service siga funcionando aunque Customer Service esté temporalmente caído.

## Consistencia eventual

El sistema no busca consistencia fuerte en todos los módulos.

Ejemplo:

Un cliente puede cambiar su correo en Customer Service, pero una campaña ya creada conserva el email snapshot usado en ese momento.

## Transactional Outbox

Todo evento relevante se guarda primero en PostgreSQL y luego se publica a RabbitMQ.

## Idempotencia

Todo consumidor debe poder procesar el mismo evento más de una vez sin duplicar datos.

Estrategias:

- Unique constraints.
- Event IDs procesados.
- Upserts.
- Locks.
- Estados transaccionales.

## Auditoría

Cambios importantes deben registrarse.

Ejemplos:

- Cliente actualizado.
- Ticket reasignado.
- Campaña iniciada.
- Reporte generado.
- Job fallido.


---

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


---

# 03 - MVP vs Enterprise

## MVP

El MVP debe concentrarse en demostrar ingeniería sin volverse interminable.

### Incluye

- Auth.
- Customers.
- Importación CSV por streams.
- Campaigns.
- RabbitMQ.
- Workers.
- Outbox.
- Saga básica de campaña.
- Reporte CSV simple.
- Dashboard de progreso básico.

## Enterprise

La versión Enterprise agrega:

- Multi-tenant.
- Circuit breakers reales.
- Bulkheads.
- Observabilidad completa.
- Métricas con Prometheus.
- Trazas distribuidas.
- Kubernetes.
- CI/CD.
- Read models.
- CQRS para reportes.
- Sagas más complejas.
- Reintentos con backoff.
- DLQ dashboard.
- Data retention.
- Archiving.


---

# Auth Service

## Base de datos

`auth_db`

## Responsabilidad

Gestionar usuarios, roles, permisos, sesiones y refresh tokens.

## Tablas

- users
- roles
- permissions
- user_roles
- role_permissions
- refresh_tokens
- outbox_events

## SQL inicial

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  revoked_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
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
users N:M roles
roles N:M permissions
users 1:N refresh_tokens
```

## Eventos publicados

- auth.user.created
- auth.user.logged_in
- auth.user.logged_out
- auth.permissions.changed

## Eventos consumidos

Inicialmente ninguno.

## APIs

```http
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id/status
```

## Cache Redis

```text
auth:permissions:user:{userId}
auth:session:{sessionId}
auth:login:attempts:{email}
```

## Patrones

- Repository.
- Strategy para hashing.
- Factory para token service.
- Cache Aside.
- Chain of Responsibility para middlewares.


---

# Campaign Service

## Base de datos

`campaign_db`

## Responsabilidad

Gestionar campañas, segmentos, recipients, ejecuciones y logs.

## Tablas

- campaigns
- campaign_segments
- campaign_recipients
- campaign_executions
- campaign_execution_logs
- outbox_events

## SQL inicial

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  type VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL,
  scheduled_at TIMESTAMP NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled')),
  CHECK (type IN ('email', 'sms', 'call'))
);

CREATE TABLE campaign_segments (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  name VARCHAR(150) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  customer_id UUID NOT NULL,
  customer_name_snapshot VARCHAR(200) NULL,
  customer_email_snapshot VARCHAR(255) NULL,
  customer_phone_snapshot VARCHAR(30) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  processed_at TIMESTAMP NULL,
  CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped'))
);

CREATE TABLE campaign_executions (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  total_recipients INT NOT NULL DEFAULT 0,
  processed_recipients INT NOT NULL DEFAULT 0,
  failed_recipients INT NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE campaign_execution_logs (
  id UUID PRIMARY KEY,
  campaign_execution_id UUID NOT NULL REFERENCES campaign_executions(id),
  recipient_id UUID NULL REFERENCES campaign_recipients(id),
  level VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (level IN ('info', 'warn', 'error'))
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_recipients_campaign_status
ON campaign_recipients(campaign_id, status);
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
campaigns 1:N campaign_segments
campaigns 1:N campaign_recipients
campaigns 1:N campaign_executions
campaign_executions 1:N campaign_execution_logs
```

## Eventos publicados

- campaign.created
- campaign.scheduled
- campaign.started
- campaign.recipient.processing
- campaign.recipient.sent
- campaign.recipient.failed
- campaign.completed
- campaign.failed

## Eventos consumidos

- customer.created
- customer.updated
- notification.sent
- notification.failed

## APIs

```http
POST /api/v1/campaigns
GET  /api/v1/campaigns
GET  /api/v1/campaigns/:id
PATCH /api/v1/campaigns/:id
POST /api/v1/campaigns/:id/start
POST /api/v1/campaigns/:id/cancel
GET  /api/v1/campaigns/:id/progress
```

## Saga

La campaña puede usar una saga:

```text
Create Campaign
 -> Resolve Segment
 -> Create Recipients
 -> Start Execution
 -> Send Notifications
 -> Update Progress
 -> Complete Campaign
```

Compensación:

```text
Si falla creación de recipients:
 -> campaign.failed
 -> liberar locks
 -> notificar usuario
```

## Cache Redis

```text
campaign:progress:{campaignId}
campaign:stats:{campaignId}
```

## Patrones

- Saga.
- State Machine.
- Repository.
- Outbox.
- Event-driven.
- Circuit Breaker para llamadas a Notification Service.


---

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


---

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


---

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
  id UUID PRIMARY KEY,
  user_id UUID NULL,
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

CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id),
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (channel IN ('websocket', 'email')),
  CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
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


---

# Orchestrator / Worker Service

## Base de datos

`orchestrator_db`

## Responsabilidad

Gestionar jobs, attempts, DLQ, sagas y estados de circuit breaker.

## Tablas

- jobs
- job_attempts
- dead_letter_jobs
- saga_instances
- saga_steps
- circuit_breaker_states

## SQL inicial

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL,
  correlation_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE job_attempts (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id),
  attempt_number INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  error_message TEXT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP NULL,
  CHECK (status IN ('processing', 'completed', 'failed')),
  UNIQUE(job_id, attempt_number)
);

CREATE TABLE dead_letter_jobs (
  id UUID PRIMARY KEY,
  original_job_id UUID NULL,
  queue_name VARCHAR(150) NOT NULL,
  routing_key VARCHAR(150) NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  failed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE saga_instances (
  id UUID PRIMARY KEY,
  saga_name VARCHAR(150) NOT NULL,
  correlation_id UUID NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'started',
  current_step VARCHAR(150) NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP NULL,
  CHECK (status IN ('started', 'completed', 'failed', 'compensating', 'compensated'))
);

CREATE TABLE saga_steps (
  id UUID PRIMARY KEY,
  saga_instance_id UUID NOT NULL REFERENCES saga_instances(id),
  step_name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  input_payload JSONB NULL,
  output_payload JSONB NULL,
  error_message TEXT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  CHECK (status IN ('pending', 'completed', 'failed', 'compensated'))
);

CREATE TABLE circuit_breaker_states (
  id UUID PRIMARY KEY,
  service_name VARCHAR(150) NOT NULL,
  resource_name VARCHAR(150) NOT NULL,
  state VARCHAR(30) NOT NULL DEFAULT 'closed',
  failure_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMP NULL,
  opened_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(service_name, resource_name),
  CHECK (state IN ('closed', 'open', 'half_open'))
);

CREATE INDEX idx_jobs_status_type ON jobs(status, type);
CREATE INDEX idx_saga_instances_correlation ON saga_instances(correlation_id);
```

## Relaciones

```text
jobs 1:N job_attempts
saga_instances 1:N saga_steps
```

## Eventos publicados

- job.started
- job.completed
- job.failed
- saga.started
- saga.completed
- saga.failed
- circuit_breaker.opened
- circuit_breaker.closed

## Eventos consumidos

- import.customer.batch.created
- campaign.started
- report.requested
- notification.failed

## APIs internas

```http
GET  /internal/jobs/:id
GET  /internal/sagas/:id
GET  /internal/dead-letter-jobs
POST /internal/dead-letter-jobs/:id/retry
GET  /internal/circuit-breakers
```

## Patrones

- Saga Orchestration.
- Retry Pattern.
- Circuit Breaker.
- Dead Letter Queue.
- Idempotent Consumer.
- Bulkhead.


---

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
  id UUID PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  filters JSONB NULL,
  requested_by UUID NOT NULL,
  file_id UUID NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE report_files (
  id UUID PRIMARY KEY,
  report_job_id UUID NOT NULL UNIQUE REFERENCES report_jobs(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  columns JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE report_read_models (
  id UUID PRIMARY KEY,
  source_entity VARCHAR(100) NOT NULL,
  source_id UUID NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (source_entity, source_id)
);

CREATE INDEX idx_report_jobs_status ON report_jobs(status);
CREATE INDEX idx_report_read_models_source ON report_read_models(source_entity, source_id);
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


---

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


---

# Exchanges, Queues, Retry and DLQ

## Exchanges

```text
streamcrm.events.topic
streamcrm.commands.direct
streamcrm.retry.direct
streamcrm.dlx
```

## Topic Exchange

`streamcrm.events.topic`

Routing keys:

```text
customer.created
customer.updated
import.customer.batch.completed
campaign.started
campaign.completed
ticket.created
report.generated
notification.failed
```

## Commands Exchange

`streamcrm.commands.direct`

Routing keys:

```text
command.import.customers
command.campaign.start
command.report.generate
command.notification.send
```

## Queues

```text
auth.events.queue
customer.events.queue
import.commands.queue
campaign.commands.queue
campaign.events.queue
report.commands.queue
notification.commands.queue
orchestrator.events.queue
```

## Retry Queues

```text
import.retry.5s
campaign.retry.10s
report.retry.30s
notification.retry.30s
```

## Dead Letter Queue

```text
streamcrm.dlq
```

## Flujo de error

```text
Consumer fails
 -> NACK
 -> Retry Queue
 -> Original Queue
 -> Max attempts exceeded
 -> DLQ
```

## Mensaje en DLQ

```json
{
  "originalExchange": "streamcrm.events.topic",
  "originalRoutingKey": "campaign.started",
  "payload": {},
  "error": "Timeout calling notification service",
  "failedAt": "date"
}
```


---

# RabbitMQ Events

## Formato estándar de evento

```json
{
  "eventId": "uuid",
  "eventName": "customer.created",
  "version": 1,
  "occurredAt": "2026-06-26T18:00:00.000Z",
  "correlationId": "uuid",
  "causationId": "uuid",
  "producer": "customer-service",
  "payload": {}
}
```

## Eventos por dominio

### Auth

- auth.user.created
- auth.user.logged_in
- auth.user.logged_out
- auth.permissions.changed

### Customer

- customer.created
- customer.updated
- customer.deleted
- customer.status.changed
- customer.import.row.processed

### Import

- import.customer.batch.created
- import.customer.batch.started
- import.customer.row.validated
- import.customer.row.invalid
- import.customer.batch.completed
- import.customer.batch.failed

### Campaign

- campaign.created
- campaign.scheduled
- campaign.started
- campaign.recipient.processing
- campaign.recipient.sent
- campaign.recipient.failed
- campaign.completed
- campaign.failed

### Ticket

- ticket.created
- ticket.assigned
- ticket.comment.created
- ticket.status.changed
- ticket.closed

### Report

- report.requested
- report.processing.started
- report.generated
- report.failed

### Notification

- notification.created
- notification.sent
- notification.failed
- notification.read

### Orchestrator

- job.started
- job.completed
- job.failed
- saga.started
- saga.completed
- saga.failed
- circuit_breaker.opened
- circuit_breaker.closed


---

# Saga Flows

## Campaign Execution Saga

### Objetivo

Coordinar la ejecución de una campaña sin usar transacciones distribuidas.

### Pasos

```text
1. campaign.created
2. resolve campaign segment
3. create recipients
4. campaign.started
5. send notifications
6. update recipient statuses
7. campaign.completed
```

### Compensaciones

Si falla resolución de segmento:

```text
campaign.failed
```

Si falla envío a muchos recipients:

```text
campaign.partially_failed
```

Si falla Notification Service:

```text
open circuit breaker
retry
send to DLQ
```

## Import Customers Saga

```text
1. import.customer.batch.created
2. parse CSV with stream
3. validate rows
4. publish valid rows
5. customer-service creates customers
6. import progress updated
7. import.customer.batch.completed
```

## Report Generation Saga

```text
1. report.requested
2. create report job
3. query read model or source API
4. stream CSV
5. store file
6. report.generated
7. notify user
```


---

# API Summary

## Auth

```http
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Customers

```http
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
POST   /api/v1/customers/:id/notes
GET    /api/v1/customers/:id/history
```

## Imports

```http
POST /api/v1/imports/customers
GET  /api/v1/imports/:id
GET  /api/v1/imports/:id/errors
POST /api/v1/imports/:id/cancel
```

## Campaigns

```http
POST /api/v1/campaigns
GET  /api/v1/campaigns
GET  /api/v1/campaigns/:id
PATCH /api/v1/campaigns/:id
POST /api/v1/campaigns/:id/start
POST /api/v1/campaigns/:id/cancel
GET  /api/v1/campaigns/:id/progress
```

## Tickets

```http
POST /api/v1/tickets
GET  /api/v1/tickets
GET  /api/v1/tickets/:id
PATCH /api/v1/tickets/:id
POST /api/v1/tickets/:id/comments
POST /api/v1/tickets/:id/assign
POST /api/v1/tickets/:id/close
```

## Reports

```http
POST /api/v1/reports
GET  /api/v1/reports/:id
GET  /api/v1/reports/:id/download
GET  /api/v1/reports/templates
POST /api/v1/reports/templates
```

## Notifications

```http
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
GET  /api/v1/notifications/unread-count
```


---

# Observability Data

## Campos estándar en logs

```json
{
  "timestamp": "date",
  "level": "info",
  "service": "customer-service",
  "requestId": "uuid",
  "correlationId": "uuid",
  "userId": "uuid",
  "message": "Customer created",
  "metadata": {}
}
```

## IDs importantes

- requestId: identifica un HTTP request.
- correlationId: conecta requests, eventos y jobs.
- causationId: identifica qué evento causó otro evento.
- jobId: identifica un job.
- sagaId: identifica una saga.

## Métricas sugeridas

- http_request_duration_ms
- http_requests_total
- rabbitmq_messages_published_total
- rabbitmq_messages_consumed_total
- jobs_completed_total
- jobs_failed_total
- import_rows_processed_total
- campaign_recipients_processed_total
- report_generation_duration_ms
- circuit_breaker_state

## Health checks

```http
GET /health
GET /ready
```

Validar:

- PostgreSQL.
- Redis.
- RabbitMQ.
- Disk storage.


---

# Redis Cache Strategy

## Usos principales

- Sesiones.
- Permisos.
- Rate limiting.
- Progreso de importaciones.
- Progreso de campañas.
- Pub/Sub para WebSocket.
- Locks distribuidos.
- Métricas temporales.

## Keys sugeridas

### Auth

```text
auth:permissions:user:{userId}
auth:session:{sessionId}
auth:login:attempts:{email}
```

### Customer

```text
customer:{customerId}
customers:stats:status
customers:stats:country
customers:summary
```

### Import

```text
import:progress:{batchId}
```

### Campaign

```text
campaign:progress:{campaignId}
campaign:stats:{campaignId}
```

### Notification Pub/Sub

```text
ws:user:{userId}
ws:campaign:{campaignId}
ws:import:{batchId}
```

## Estrategia

Usar Cache Aside:

```text
1. Buscar en Redis
2. Si no existe, consultar PostgreSQL
3. Guardar en Redis con TTL
4. Invalidar cuando cambie la entidad
```

## TTL sugeridos

```text
permissions: 15 min
customer detail: 5 min
dashboard stats: 30 sec
campaign progress: 1 hour
import progress: 1 hour
```


---

# Roadmap

## MVP Roadmap

### Milestone 1

- Monorepo.
- Docker Compose base.
- Auth Service.
- Customer Service.

### Milestone 2

- Import Service.
- CSV upload.
- Streams.
- RabbitMQ publishing.
- Customer import worker.

### Milestone 3

- Campaign Service.
- Campaign recipients.
- Campaign execution.
- Saga básica.

### Milestone 4

- Notification Service básico.
- WebSocket progress.
- Redis Pub/Sub.

### Milestone 5

- Report Service básico.
- CSV export con streams.
- README final del proyecto.

## Enterprise Roadmap

- Kubernetes.
- CI/CD.
- Prometheus.
- Grafana.
- OpenTelemetry.
- Multi-tenant.
- Advanced Saga Orchestration.
- Circuit Breaker dashboard.
- DLQ management UI.
- Contract testing.
- Load testing with k6.
