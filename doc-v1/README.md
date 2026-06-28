# StreamCRM Documentation

StreamCRM es un CRM empresarial orientado a campañas, atención al cliente, procesamiento masivo de datos, reportes por streams, dashboard en tiempo real y arquitectura distribuida.

## Objetivo principal

Construir un proyecto de portafolio backend con nivel empresarial, capaz de demostrar:

- Node.js avanzado.
- TypeScript aplicado a arquitectura real.
- PostgreSQL intermedio-avanzado.
- Redis para cache, sesiones, locks y pub/sub.
- RabbitMQ para comunicación asíncrona.
- Workers para procesamiento en segundo plano.
- Streams para importaciones y exportaciones masivas.
- WebSockets para dashboard en tiempo real.
- Patrones de diseño y arquitectura distribuida.
- Observabilidad, testing y despliegue con Docker.

## Estructura documental

```text
streamcrm-docs/
├── README.md
├── docs/
│   ├── 01-introduction.md
│   ├── 02-objectives.md
│   ├── 03-architecture.md
│   └── 04-monorepo.md
├── services/
│   ├── 05-api-gateway.md
│   ├── 06-auth-service.md
│   └── 07-customer-service.md
├── diagrams/
│   └── architecture.md
└── roadmap/
    └── next-phases.md
```

## Fases

### Fase 1

- Introducción.
- Objetivos.
- Arquitectura general.
- Estructura del monorepo.
- API Gateway.
- Auth Service.
- Customer Service.

### Fase 2

- Campaign Service.
- Ticket Service.
- Import Service.
- Report Service.
- Notification Service.
- Worker Service.

### Fase 3

- RabbitMQ.
- Exchanges.
- Queues.
- Retry.
- Dead Letter Queue.
- Saga Pattern.
- Circuit Breaker.

### Fase 4

- PostgreSQL schema.
- Diseño de tablas.
- Redis cache strategy.
- DTOs.
- Event contracts.
- REST API design.

### Fase 5

- Observabilidad.
- Logging.
- Metrics.
- Tracing.
- Testing.
- Docker Compose.
- Kubernetes.
- CI/CD.
- Roadmap MVP.
- Roadmap Enterprise.
