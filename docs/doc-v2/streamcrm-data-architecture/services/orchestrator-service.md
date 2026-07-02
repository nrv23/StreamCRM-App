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
  id SERIAL PRIMARY KEY,

  job_id UUID NOT NULL UNIQUE,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  payload JSONB NOT NULL,
  correlation_id UUID NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_jobs_status_type
ON jobs(status, type);

CREATE INDEX idx_jobs_correlation_id
ON jobs(correlation_id);
CREATE TABLE job_attempts (
  id SERIAL PRIMARY KEY,

  job_id INT NOT NULL REFERENCES jobs(id),

  attempt_number INT NOT NULL,
  status VARCHAR(30) NOT NULL,

  error_message TEXT NULL,

  started_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP NULL,

  CHECK (status IN ('processing', 'completed', 'failed')),
  UNIQUE(job_id, attempt_number)
);

CREATE INDEX idx_job_attempts_job_id
ON job_attempts(job_id);
CREATE TABLE dead_letter_jobs (
  id SERIAL PRIMARY KEY,

  original_job_id INT NULL REFERENCES jobs(id),

  queue_name VARCHAR(150) NOT NULL,
  routing_key VARCHAR(150) NULL,

  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,

  failed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_dead_letter_jobs_original_job_id
ON dead_letter_jobs(original_job_id);
CREATE TABLE saga_instances (
  id SERIAL PRIMARY KEY,

  saga_id UUID NOT NULL UNIQUE,
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

CREATE INDEX idx_saga_instances_correlation
ON saga_instances(correlation_id);

CREATE INDEX idx_saga_instances_status
ON saga_instances(status);
CREATE TABLE saga_steps (
  id SERIAL PRIMARY KEY,

  saga_instance_id INT NOT NULL REFERENCES saga_instances(id),

  step_name VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',

  input_payload JSONB NULL,
  output_payload JSONB NULL,
  error_message TEXT NULL,

  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,

  CHECK (status IN ('pending', 'completed', 'failed', 'compensated'))
);

CREATE INDEX idx_saga_steps_saga_instance_id
ON saga_steps(saga_instance_id);
CREATE TABLE circuit_breaker_states (
  id SERIAL PRIMARY KEY,

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

CREATE INDEX idx_circuit_breaker_states_state
ON circuit_breaker_states(state);
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
