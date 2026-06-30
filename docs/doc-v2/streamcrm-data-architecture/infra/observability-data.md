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
