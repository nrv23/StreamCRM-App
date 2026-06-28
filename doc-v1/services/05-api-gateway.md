# 05 - API Gateway / Main API

## Responsabilidad

El API Gateway es la puerta de entrada del sistema.

En la primera versión, será parte de la API principal. En una evolución futura, podría separarse como servicio independiente.

## Tecnologías

- Node.js.
- TypeScript.
- Express.
- PostgreSQL.
- Redis.
- RabbitMQ.
- Zod o Joi para validación.
- Pino para logging.

## Funciones principales

### Routing

Expone endpoints REST para:

- Auth.
- Customers.
- Campaigns.
- Tickets.
- Imports.
- Reports.
- Dashboard.

### Authentication middleware

Valida:

- Access token.
- Refresh token cuando aplique.
- Sesión activa.
- Usuario existente.
- Usuario habilitado.

### Authorization middleware

Valida:

- Roles.
- Permisos.
- Recursos permitidos.

### Rate limiting

Usando Redis.

Casos:

- Login.
- Upload de archivos.
- Exportación de reportes.
- Creación de campañas.

### Request validation

Cada request debe validarse mediante DTO/schema.

### Error handling

El API Gateway debe tener un middleware global para errores.

Tipos de error:

- ValidationError.
- AuthenticationError.
- AuthorizationError.
- NotFoundError.
- ConflictError.
- DomainError.
- InfrastructureError.

### Correlation ID

Cada request debe generar o recibir `x-correlation-id`.

Este ID se propaga a:

- Logs.
- RabbitMQ events.
- Workers.
- Reportes.
- Auditoría.

## Patrones aplicados

### Chain of Responsibility

Para middlewares:

```text
Request
 -> requestId
 -> logger
 -> auth
 -> authorization
 -> validation
 -> controller
```

### Factory Pattern

Para construir servicios según dependencias.

### Dependency Injection

Para inyectar repositories, publishers y servicios.

### Controller-Service-Repository

Separación base:

```text
Controller
 -> Use Case / Service
 -> Repository
 -> Database
```

## Endpoints iniciales

```http
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id

POST   /api/v1/imports/customers
GET    /api/v1/imports/:id

POST   /api/v1/campaigns
GET    /api/v1/campaigns
POST   /api/v1/campaigns/:id/start

GET    /api/v1/reports/customers/export
POST   /api/v1/reports/customers/async
```
