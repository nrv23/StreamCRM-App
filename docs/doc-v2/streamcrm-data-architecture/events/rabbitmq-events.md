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
