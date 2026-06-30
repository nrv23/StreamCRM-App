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
