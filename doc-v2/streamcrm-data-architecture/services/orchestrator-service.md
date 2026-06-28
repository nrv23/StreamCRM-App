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
