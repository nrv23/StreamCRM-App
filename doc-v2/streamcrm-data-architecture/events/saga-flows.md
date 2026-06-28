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
