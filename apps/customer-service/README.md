# Customer Service

Servicio de clientes de StreamCRM.

## Arquitectura

```text
api            -> Express, routes, controllers, validators
application    -> DTOs y casos de uso
domain         -> entidades, eventos, errores e interfaces repository
infrastructure -> PostgreSQL, Redis, RabbitMQ, mappers
```

## Flujo inicial

```text
Route
 -> Controller
 -> Use Case
 -> CustomerRepository interface
 -> PostgresCustomerRepository
 -> PostgreSQL
```

## Decisiones

- No se usa carpeta `ports` por ahora.
- El repository interface funciona como port.
- No se usan Value Objects inicialmente.
- La entidad valida reglas mínimas de negocio.
- Express-validator valida el request HTTP.
