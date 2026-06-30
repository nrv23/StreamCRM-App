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
