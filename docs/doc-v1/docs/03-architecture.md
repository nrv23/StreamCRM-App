# 03 - Architecture

## Visión general

StreamCRM usará una arquitectura modular con servicios internos desacoplados por eventos.

Para mantener el proyecto alcanzable, se recomienda iniciar con un **modular monolith** bien separado y evolucionar gradualmente hacia servicios independientes.

## Estilo arquitectónico base

### Modular Monolith inicial

Ventajas:

- Menor complejidad inicial.
- Desarrollo más rápido.
- Menos sobrecarga de despliegue.
- Permite mantener límites claros por módulo.
- Fácil evolución hacia microservicios.

### Event Driven Architecture

El sistema usará eventos para desacoplar procesos.

Ejemplos:

- `customer.import.started`
- `customer.import.completed`
- `campaign.created`
- `campaign.processing.started`
- `ticket.created`
- `report.generated`
- `notification.sent`

### Distributed Workers

Los procesos pesados se ejecutarán fuera del request HTTP:

- Importación de clientes.
- Procesamiento de campañas.
- Generación de reportes.
- Envío de notificaciones.
- Cálculo de métricas.

## Arquitectura lógica

```text
Frontend React
    |
    | HTTP / WebSocket
    v
API Gateway / Main API
    |
    | Internal modules
    v
Domain Services
    |
    +--> PostgreSQL
    +--> Redis
    +--> RabbitMQ
              |
              v
          Worker Services
              |
              +--> PostgreSQL
              +--> Redis
              +--> Notification Service
```

## Principios arquitectónicos

### Separación de responsabilidades

Cada módulo debe tener una responsabilidad clara.

### Alta cohesión

Las reglas de negocio de cada módulo viven dentro de su propio dominio.

### Bajo acoplamiento

La comunicación entre procesos pesados se hace mediante eventos.

### Idempotencia

Los handlers de eventos deben poder ejecutarse más de una vez sin causar inconsistencias.

### Observabilidad desde el inicio

Todo request y job debe poder rastrearse mediante:

- `requestId`
- `correlationId`
- `jobId`
- `userId`

### Consistencia eventual

El sistema acepta que algunos datos derivados no estén actualizados instantáneamente.

## Patrones arquitectónicos usados

- Modular Monolith.
- Event Driven Architecture.
- Producer / Consumer.
- Saga Pattern.
- Circuit Breaker.
- Retry Pattern.
- Dead Letter Queue.
- Cache Aside.
- Repository Pattern.
- Strategy Pattern.
- Factory Pattern.
- Observer Pattern.
- Dependency Injection.
