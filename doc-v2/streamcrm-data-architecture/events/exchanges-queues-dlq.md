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
