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
