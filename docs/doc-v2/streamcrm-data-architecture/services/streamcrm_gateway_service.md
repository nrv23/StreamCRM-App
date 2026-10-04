# StreamCRM API Gateway Service

## 1. Objetivo

El **API Gateway** será el punto de entrada único para los clientes de StreamCRM.

Su responsabilidad es recibir requests externos, aplicar controles transversales y reenviar cada request al microservicio correcto. No debe convertirse en un microservicio de negocio.

```text
Cliente / Frontend
        |
        v
+-----------------------+
|      API Gateway      |
|-----------------------|
| Routing               |
| JWT validation        |
| Correlation ID        |
| Rate limiting         |
| Logging               |
| Permission checks     |
| HTTP/WebSocket proxy  |
+-----------+-----------+
            |
     +------+------+
     |             |
     v             v
 Auth Service   Customer Service
     |
     +--------------------+
                          v
                Notification Service
```

A futuro:

```text
Client
  |
  v
API Gateway
  |
  +--> Auth Service
  +--> Customer Service
  +--> Notification Service
  +--> Campaign Service
  +--> Ticket Service
  +--> Import Service
  +--> Report Service
  +--> Orchestrator Service
```

---

## 2. Responsabilidades del Gateway

El Gateway debe encargarse de responsabilidades compartidas entre servicios:

1. Punto de entrada único.
2. Routing hacia microservicios.
3. Validación inicial del access token.
4. Extracción de identidad.
5. Propagación del contexto del usuario.
6. Correlation ID / Request ID.
7. Rate limiting.
8. Logging estructurado.
9. Timeouts.
10. Manejo de errores de proxy.
11. CORS.
12. Security headers.
13. HTTP proxy.
14. WebSocket proxy.
15. Health/readiness.
16. Métricas.
17. Graceful shutdown.
18. Preparación para escalado horizontal.
19. Integración futura con OpenTelemetry.

---

## 3. Lo que NO debe hacer

El Gateway no debe contener reglas de negocio.

Ejemplos que pertenecen a los microservicios:

```text
¿Puede este usuario editar este customer?
¿El código 2FA expiró?
¿El usuario está bloqueado?
¿La notificación ya fue entregada?
¿El customer existe?
¿El ticket pertenece a este agente?
```

Principio:

```text
Gateway = control transversal y frontera externa
Microservicio = autoridad final de dominio
```

---

## 4. Stack recomendado

```text
Node.js 22+
TypeScript
Express
http-proxy-middleware
jose o jsonwebtoken
Redis
Logger estructurado actual
Prometheus
OpenTelemetry (posterior)
Docker
Kubernetes (posterior)
```

El Gateway no necesita inicialmente:

```text
PostgreSQL
RabbitMQ
Outbox
ORM
workers de negocio
```

---

## 5. Estructura sugerida

```text
gateway-service/
|
├── src/
│   ├── config/
│   │   ├── environment.ts
│   │   ├── routes.config.ts
│   │   ├── redis.config.ts
│   │   └── observability.config.ts
│   |
│   ├── core/
│   │   ├── errors/
│   │   │   ├── GatewayError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   ├── RateLimitError.ts
│   │   │   └── ServiceUnavailableError.ts
│   │   └── types/
│   │       ├── AuthenticatedRequest.ts
│   │       ├── GatewayRoute.ts
│   │       └── RequestContext.ts
│   |
│   ├── middleware/
│   │   ├── correlationId.middleware.ts
│   │   ├── requestLogger.middleware.ts
│   │   ├── authentication.middleware.ts
│   │   ├── authorization.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── securityHeaders.middleware.ts
│   │   ├── requestTimeout.middleware.ts
│   │   └── errorHandler.middleware.ts
│   |
│   ├── proxy/
│   │   ├── proxyFactory.ts
│   │   ├── auth.proxy.ts
│   │   ├── customer.proxy.ts
│   │   ├── notification.proxy.ts
│   │   └── websocket.proxy.ts
│   |
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   └── notification.routes.ts
│   |
│   ├── security/
│   │   ├── jwtVerifier.ts
│   │   ├── permissionGuard.ts
│   │   └── tokenExtractor.ts
│   |
│   ├── redis/
│   │   ├── redisClient.ts
│   │   └── rateLimitStore.ts
│   |
│   ├── observability/
│   │   ├── logger.ts
│   │   ├── metrics.ts
│   │   └── tracing.ts
│   |
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── dependencyHealth.ts
│   |
│   ├── app.ts
│   └── main.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

No es necesario crear todos estos archivos desde el primer commit. Es el estado objetivo.

---

## 6. Routing inicial

```text
/api/v1/auth/*           -> auth-service
/api/v1/customers/*      -> customer-service
/api/v1/notifications/*  -> notification-service
```

Ejemplo:

```text
POST /api/v1/auth/login
        |
        v
Gateway
        |
        v
http://auth-service:3000/api/v1/auth/login
```

---

## 7. Configuración centralizada de servicios

Evitar URLs hardcodeadas.

```ts
export interface GatewayRoute {
    prefix: string;
    target: string;
    authRequired: boolean;
}

export const gatewayRoutes: GatewayRoute[] = [
    {
        prefix: '/api/v1/auth',
        target: env.authServiceUrl,
        authRequired: false,
    },
    {
        prefix: '/api/v1/customers',
        target: env.customerServiceUrl,
        authRequired: true,
    },
    {
        prefix: '/api/v1/notifications',
        target: env.notificationServiceUrl,
        authRequired: true,
    },
];
```

`.env` local:

```env
AUTH_SERVICE_URL=http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3001
CUSTOMER_SERVICE_URL=http://localhost:3002
```

Docker Compose:

```text
http://auth-service:3000
http://notification-service:3001
http://customer-service:3002
```

Kubernetes utilizará DNS interno de servicios.

---

## 8. Orden recomendado de middlewares

```text
Request
  |
  v
Security Headers
  |
  v
Correlation ID
  |
  v
Request Logger
  |
  v
Rate Limiter
  |
  v
Authentication
  |
  v
Authorization
  |
  v
Proxy
  |
  v
Microservice
```

Ejemplo:

```ts
app.use(securityHeadersMiddleware);
app.use(correlationIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(globalRateLimitMiddleware);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandlerMiddleware);
```

---

## 9. Correlation ID

Cada request debe tener:

```text
x-correlation-id
```

Si el cliente no lo envía:

```text
Gateway -> crypto.randomUUID()
```

Ejemplo:

```ts
const correlationId =
    req.header('x-correlation-id') ??
    crypto.randomUUID();

req.context = {
    correlationId,
};

res.setHeader(
    'x-correlation-id',
    correlationId,
);
```

Al proxy:

```ts
proxyReq.setHeader(
    'x-correlation-id',
    req.context.correlationId,
);
```

Flujo:

```text
Client
  |
  | correlation-id abc-123
  v
Gateway
  |
  v
Auth Service
  |
  v
Outbox
  |
  v
RabbitMQ
  |
  v
Notification Service
```

Esto permitirá investigar una operación completa.

---

## 10. Request Context

```ts
export interface RequestContext {
    correlationId: string;

    user?: {
        id: number;
        externalId?: string;
        email?: string;
        permissions?: string[];
        roles?: string[];
    };
}
```

Usar:

```text
req.context
```

como contexto central del request.

---

## 11. Autenticación

El Gateway valida el access token antes de acceder a rutas protegidas.

```text
Authorization: Bearer ey...
        |
        v
Gateway
        |
        +--> firma válida
        +--> no expirado
        +--> issuer válido
        +--> audience válida
        |
        v
Request autorizado
```

El Gateway NO debe:

```text
validar passwords
crear sesiones
rotar refresh tokens
validar 2FA
```

Eso pertenece a Auth Service.

---

## 12. Rutas públicas

Ejemplos:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/2fa/verify
POST /api/v1/auth/2fa/resend
GET  /health
```

Las rutas finales deben corresponder exactamente con Auth Service.

---

## 13. Rutas protegidas

Ejemplos:

```text
GET   /api/v1/customers
GET   /api/v1/customers/:id
PATCH /api/v1/customers/:id

GET   /api/v1/notifications
PATCH /api/v1/notifications/:id/read
GET   /api/v1/notifications/unread-count
```

---

## 14. Verificación JWT local

Evitar:

```text
Gateway
 -> Auth Service
 -> "¿este token es válido?"
```

en cada request.

Preferir:

```text
Auth Service
 -> firma JWT

Gateway
 -> verifica firma localmente
```

Esto reduce:

```text
latencia
acoplamiento
carga sobre Auth
```

---

## 15. Firma asimétrica futura

Una evolución recomendable:

```text
Auth Service
   |
   | private key
   v
firma JWT
```

Gateway:

```text
public key
   |
   v
verifica JWT
```

Ejemplos:

```text
RS256
ES256
```

Ventaja: Gateway puede verificar tokens pero no generarlos.

---

## 16. Claims recomendados

Ejemplo conceptual:

```json
{
  "sub": "user-external-id",
  "user_id": 7,
  "email": "user@example.com",
  "permissions": [
    "customers.read",
    "notifications.read"
  ],
  "iat": 1790000000,
  "exp": 1790000900,
  "iss": "streamcrm-auth-service",
  "aud": "streamcrm-api"
}
```

No introducir datos sensibles innecesarios.

---

## 17. Propagación de identidad

Después de validar JWT:

```text
x-user-id
x-user-external-id
x-correlation-id
```

Regla crítica:

> Los microservicios solo pueden confiar en estos headers si no son accesibles directamente desde Internet.

Producción:

```text
Internet
   |
   v
Gateway
   |
   v
red privada
   |
   +--> Auth
   +--> Customer
   +--> Notification
```

---

## 18. Sanitización de headers internos

Eliminar cualquier valor enviado por el cliente como:

```text
x-user-id
x-user-role
x-user-permissions
x-internal-service
```

y reconstruirlo desde información verificada.

Esto evita:

```text
Cliente malicioso
x-user-id: 1
```

---

## 19. Authorization / Permission Guard

El Gateway puede realizar autorización de primera línea.

Ejemplo:

```text
GET /customers
requires customers.read
```

Flujo:

```text
JWT
 |
 v
permissions[]
 |
 v
requirePermission('customers.read')
 |
 +--> permitido -> proxy
 |
 +--> rechazado -> 403
```

Ejemplo conceptual:

```ts
export const requirePermission =
    (permission: string) =>
    (req, _res, next) => {

        const permissions =
            req.context.user?.permissions ?? [];

        if (!permissions.includes(permission)) {
            throw new ForbiddenError();
        }

        next();
    };
```

---

## 20. Defensa en profundidad

El Gateway hace autorización general:

```text
¿posee customers.update?
```

Customer Service conserva autoridad de dominio:

```text
¿puede modificar ESTE customer?
```

Por lo tanto:

```text
Gateway = coarse-grained authorization
Service = domain/resource authorization
```

---

## 21. Rate Limiting

El Gateway es el lugar natural para rate limiting transversal.

Ejemplos iniciales:

```text
login:
5 intentos/min/IP

2FA verify:
10 intentos/min

2FA resend:
3 intentos/10 min

API general:
100-300 requests/min/user
```

Los números deben ajustarse con pruebas.

---

## 22. Redis para rate limiting

No usar memoria local como implementación final:

```text
Gateway A -> contador A
Gateway B -> contador B
```

Con Redis:

```text
Gateway A
             Redis
      /
Gateway B
```

Keys:

```text
rate_limit:{userId}:{route}
rate_limit:{ip}:auth.login
```

---

## 23. Límites por endpoint

No todos los endpoints deben compartir el mismo límite.

```text
POST /auth/login
-> agresivo

POST /auth/2fa/resend
-> muy agresivo

GET /notifications
-> normal

GET /customers
-> normal
```

---

## 24. HTTP Proxy

Debe preservar:

```text
método
body
query params
headers permitidos
status code
response body
```

Y agregar:

```text
correlation ID
trusted user context
```

Debe manejar:

```text
timeout
upstream unavailable
connection reset
invalid upstream response
```

---

## 25. Proxy Factory

Evitar repetir configuración:

```ts
createServiceProxy({
    target: env.customerServiceUrl,
    serviceName: 'customer-service',
});
```

Responsabilidades internas:

```text
timeouts
headers
correlation ID
logging
proxy errors
```

---

## 26. Timeouts

Ningún request debe esperar indefinidamente.

Ejemplo:

```env
REQUEST_TIMEOUT_MS=10000
```

Casos pesados como reportes o imports deberían funcionar async:

```text
request
-> crea job
-> 202 Accepted
```

No mantener un HTTP request abierto varios minutos.

---

## 27. Errores de infraestructura

Customer Service apagado:

```text
Gateway
   |
   X
Customer Service
```

Respuesta:

```http
503 Service Unavailable
```

Ejemplo:

```json
{
  "ok": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Customer service is temporarily unavailable"
  },
  "correlationId": "..."
}
```

---

## 28. Error Contract

Formato común:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required"
  },
  "correlationId": "87d443..."
}
```

Otro:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  },
  "correlationId": "..."
}
```

---

## 29. Respetar errores del microservicio

Si Customer Service responde:

```http
404
```

el Gateway no debe convertirlo en:

```http
500
```

sin razón.

El proxy debe ser lo más transparente posible.

---

## 30. Logging

Registrar:

```text
timestamp
method
path
status
duration_ms
correlation_id
user_id
target_service
client_ip
```

Ejemplo:

```json
{
  "service": "gateway-service",
  "method": "GET",
  "path": "/api/v1/customers/10",
  "status": 200,
  "duration_ms": 42,
  "correlation_id": "a1f...",
  "user_id": 7,
  "target_service": "customer-service"
}
```

---

## 31. Nunca loguear secretos

No registrar:

```text
Authorization completo
JWT completo
password
refresh token
2FA code
OAuth tokens
cookies sensibles
client secret
```

Especial atención a:

```text
authcode
```

porque el flujo actual de 2FA ya lo transporta entre Auth y Notification.

---

## 32. Health y readiness

```http
GET /health
```

Respuesta:

```json
{
  "service": "gateway-service",
  "status": "ok"
}
```

Opcional:

```http
GET /ready
```

`/health`:

```text
el proceso está vivo
```

`/ready`:

```text
puede aceptar tráfico
```

---

## 33. No hacer health fan-out excesivo

Evitar:

```text
GET /health
 |
 +--> Auth
 +--> Customer
 +--> Notification
 +--> Redis
 +--> Rabbit
```

El health del Gateway debe reflejar principalmente el estado del Gateway.

---

## 34. Security Headers

Usar `helmet` o equivalente.

Controles típicos:

```text
X-Content-Type-Options
Strict-Transport-Security
Referrer-Policy
Content-Security-Policy
```

---

## 35. CORS

El Gateway debe centralizar CORS.

Local:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Producción:

```text
https://streamcrm.example.com
```

No usar:

```text
Access-Control-Allow-Origin: *
```

si existen credenciales.

---

## 36. Body limits

Ejemplo:

```ts
express.json({
    limit: '1mb',
});
```

Los imports grandes no deberían viajar como JSON gigante.

Más adelante:

```text
streaming
presigned URLs
object storage
```

---

## 37. WebSocket

Notification Service ya utiliza Socket.IO + Redis Adapter.

El Gateway debe soportar WebSocket upgrade.

```text
Client
  |
  | WebSocket
  v
Gateway
  |
  v
Notification Service
  |
  v
Socket.IO
  |
  v
Redis Adapter
```

---

## 38. Autenticación WebSocket

Objetivo:

```text
Client JWT
    |
    v
Gateway / Notification Service
    |
    v
validate token
    |
    v
userId
    |
    v
socket.join("ws:user:{userId}")
```

Nunca utilizar en producción:

```text
?room=ws:user:7
```

como autorización.

El servidor decide el room.

---

## 39. Rooms

Actual:

```text
ws:user:{userId}
```

Futuros:

```text
ws:campaign:{campaignId}
ws:import:{batchId}
```

---

## 40. Redis en Gateway

Usos adecuados:

```text
rate limiting
temporary counters
distributed state estrictamente necesario
```

No usar Redis del Gateway como almacenamiento de dominio.

---

## 41. Circuit Breaker

No es prioridad para la primera versión.

Primero:

```text
timeout
error handling
503/504
metrics
```

Después, si existe necesidad real:

```text
repeated failures
     |
     v
Circuit OPEN
     |
     v
fail fast
```

---

## 42. Service Discovery

Local:

```env
CUSTOMER_SERVICE_URL=http://localhost:3002
```

Docker:

```text
http://customer-service:3002
```

Kubernetes:

```text
http://customer-service
```

No construir un service registry propio.

---

## 43. Load Balancing

Kubernetes debe resolverlo:

```text
Gateway
  |
  v
Kubernetes Service
  |
  +--> customer pod 1
  +--> customer pod 2
  +--> customer pod 3
```

No implementar load balancing manual dentro del Gateway.

---

## 44. Variables de entorno

Ejemplo:

```env
NODE_ENV=development

PORT=8080

AUTH_SERVICE_URL=http://localhost:3000
CUSTOMER_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3001

REQUEST_TIMEOUT_MS=10000

JWT_ISSUER=streamcrm-auth-service
JWT_AUDIENCE=streamcrm-api

JWT_PUBLIC_KEY_PATH=./keys/auth-public.pem

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RATE_LIMIT_GLOBAL_MAX=200
RATE_LIMIT_GLOBAL_WINDOW_MS=60000

CORS_ALLOWED_ORIGINS=http://localhost:5173

LOG_LEVEL=info
```

Alinear nombres con el `environment.ts` real del monorepo.

---

## 45. Secrets

Nunca incluir en Git:

```text
private keys
Redis passwords
API secrets
OAuth credentials
```

Idealmente el Gateway solo necesita una:

```text
JWT public key
```

si Auth firma asimétricamente.

Producción:

```text
Kubernetes Secrets
AWS Secrets Manager
AWS Parameter Store
```

---

## 46. Graceful Shutdown

Responder a:

```text
SIGTERM
SIGINT
```

Proceso:

```text
signal
 |
 v
stop accepting requests
 |
 v
close HTTP server
 |
 v
close Redis
 |
 v
flush telemetry
 |
 v
exit
```

Importante para Kubernetes.

---

## 47. Prometheus

Métricas útiles:

```text
gateway_http_requests_total
gateway_http_request_duration_seconds
gateway_proxy_errors_total
gateway_rate_limit_rejections_total
gateway_auth_failures_total
gateway_upstream_duration_seconds
```

Labels:

```text
method
route
status_code
target_service
```

No usar labels de cardinalidad alta:

```text
user_id
email
correlation_id
```

---

## 48. OpenTelemetry

Fase posterior.

Objetivo:

```text
Client
 |
 v
Gateway span
 |
 v
Auth span
 |
 v
PostgreSQL span
```

Y asíncrono:

```text
Auth
 |
 v
Outbox
 |
 v
RabbitMQ
 |
 v
Notification
```

---

## 49. Correlation ID en RabbitMQ

El contexto puede propagarse:

```json
{
  "headers": {
    "source": "auth_service",
    "version": 1,
    "correlation_id": "abc-123"
  }
}
```

Permite rastrear:

```text
HTTP
-> Gateway
-> Auth
-> Outbox
-> Rabbit
-> Notification
-> Email
```

---

## 50. API Versioning

Mantener:

```text
/api/v1/
```

Ejemplos:

```text
/api/v1/auth
/api/v1/customers
/api/v1/notifications
```

---

## 51. Refresh Token

El refresh token sigue siendo responsabilidad de Auth Service.

```text
Client
 |
 v
Gateway
 |
 v
Auth Service
 |
 v
rotate refresh token
 |
 v
new tokens
```

Gateway no almacena refresh tokens.

---

## 52. 2FA y Gateway

El Gateway solo enruta.

```text
Client
 |
 | email/password
 v
Gateway
 |
 v
Auth Service
 |
 +--> requiresTwoFactor
 |
 +--> challengeId
```

Verify:

```text
Client
 |
 | challengeId + code
 v
Gateway
 |
 v
Auth Service
 |
 +--> validate challenge
 +--> attempts
 +--> expiry
 +--> used/revoked
 +--> session
 +--> tokens
```

El Gateway no conoce:

```text
code_hash
attempts
expires_at
two_factor_locked
```

---

## 53. Flujo completo 2FA con Gateway

```text
Client
 |
 | POST /api/v1/auth/login
 v
Gateway
 |
 +--> correlation ID
 +--> auth rate limit
 |
 v
Auth Service
 |
 +--> validate credentials
 +--> create auth_code
 +--> create outbox_event
 +--> commit
 +--> pg_notify
 |
 +-----------------------> HTTP challengeId
 |
 v
Auth Outbox Worker
 |
 +--> LISTEN
 +--> atomic claim
 +--> RabbitMQ
 |
 v
Notification Service
 |
 +--> consume event
 +--> 2FA handler
 +--> Nodemailer
 |
 v
Gmail
 |
 v
User receives code
```

Luego:

```text
Client
 |
 | challengeId + authcode
 v
Gateway
 |
 v
Auth Service
 |
 +--> validate code
 +--> status used
 +--> create session
 +--> access token
 +--> refresh token
 |
 v
Gateway
 |
 v
Client
```

---

## 54. Resend 2FA

```text
POST /api/v1/auth/2fa/resend
```

Gateway:

```text
rate limit
routing
logging
```

Auth Service:

```text
validate current challenge
revoke old challenge
create new challenge
publish new event
```

---

## 55. Gateway y RBAC

Flujo:

```text
roles
 |
 v
permissions
 |
 v
JWT
 |
 v
Gateway
```

El Gateway no administra:

```text
roles
user_roles
role_permissions
is_system
delegation
```

Eso permanece en Auth Service.

---

## 56. HTTP Status Codes

Usar correctamente:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

Diferencia:

```text
401
-> no autenticado / token inválido

403
-> autenticado pero no autorizado
```

---

## 57. Request ID vs Correlation ID

Inicialmente un solo:

```text
correlation_id
```

es suficiente.

A futuro:

```text
request_id
-> request HTTP individual

correlation_id
-> operación distribuida completa
```

---

## 58. Stateless

Mantener:

```text
Gateway 1
Gateway 2
Gateway 3
```

intercambiables.

Estado compartido solo donde corresponda:

```text
Redis
```

---

## 59. Escalado horizontal

Objetivo:

```text
Load Balancer
      |
      +--> Gateway 1
      +--> Gateway 2
      +--> Gateway 3
```

Cada instancia:

```text
stateless
JWT verification local
Redis rate limiting
```

---

## 60. Docker Compose

Ejemplo conceptual:

```yaml
gateway-service:
  build:
    context: .
  ports:
    - "8080:8080"
  environment:
    AUTH_SERVICE_URL: http://auth-service:3000
    CUSTOMER_SERVICE_URL: http://customer-service:3002
    NOTIFICATION_SERVICE_URL: http://notification-service:3001
  depends_on:
    - auth-service
    - customer-service
    - notification-service
    - redis
```

`depends_on` no reemplaza readiness ni retry logic.

---

## 61. Kubernetes futuro

```text
Internet
   |
   v
Ingress / Load Balancer
   |
   v
Gateway Service
   |
   v
Gateway Pods
   |
   +--> Auth Service
   +--> Customer Service
   +--> Notification Service
```

Recursos:

```text
Deployment
Service
ConfigMap
Secret
HPA
Ingress
PodDisruptionBudget
```

---

## 62. Tests unitarios

Prioridades:

```text
JWT verifier
token extractor
permission guard
correlation ID
rate-limit key builder
error mapper
route config
```

---

## 63. Tests de integración

```text
token válido -> proxy

token expirado -> 401

permiso faltante -> 403

service down -> 503

timeout -> 504

rate limit -> 429
```

---

## 64. Tests E2E

Ejemplo:

```text
POST /api/v1/auth/login
```

pasando realmente por Gateway.

Otro:

```text
GET /api/v1/customers
Authorization: Bearer valid-token
```

y comprobar:

```text
Gateway
-> Customer Service
-> Response
```

---

## 65. Test WebSocket

```text
token válido -> conecta
token inválido -> rechazo
user A -> room A
user B -> room B
multi-instance -> routing correcto
```

---

## 66. Load Testing

Herramientas:

```text
k6
autocannon
Artillery
```

Métricas:

```text
p50
p95
p99
throughput
error rate
CPU
memory
```

---

## 67. Failure Testing

Probar deliberadamente:

```text
Auth apagado
Customer apagado
Notification apagado
Redis apagado
latencia artificial
timeout
JWT expirado
JWT inválido
WebSocket reconnect
```

---

## 68. Anti-patterns

### No meter negocio en Gateway

Incorrecto:

```text
Gateway decide status de customer
```

Correcto:

```text
Customer Service decide
```

### No consultar Auth por cada request

Preferir validación JWT local.

### No confiar en headers del cliente

Eliminar y reconstruir trusted headers.

### No usar rate limiting en memoria

Usar Redis.

### No almacenar sesiones

Auth Service es dueño de sesiones.

### No cachear dominio indiscriminadamente

Customer cache pertenece a Customer Service.

### No convertir Gateway en API Composition monstruosa

Si en el futuro existe:

```text
/dashboard
```

que combine muchos dominios, considerar:

```text
BFF
query service
GraphQL layer
```

en vez de engordar el Gateway.

---

## 69. Primer milestone

Construir únicamente:

```text
Gateway levanta
 |
 +--> GET /health
 |
 +--> /auth -> auth-service
 |
 +--> /customers -> customer-service
 |
 +--> /notifications -> notification-service
```

Objetivo:

```text
Postman
  |
  v
Gateway
  |
  v
Microservice
```

Primero routing puro.

---

## 70. Segundo milestone

Agregar:

```text
Correlation ID
Structured logging
Timeout
Proxy error handling
```

---

## 71. Tercer milestone

Agregar:

```text
JWT verification
public routes
protected routes
```

Tests:

```text
sin token -> 401
token inválido -> 401
token válido -> proxy
```

---

## 72. Cuarto milestone

Agregar permisos:

```text
customers.read
notifications.read
...
```

Tests:

```text
token + permiso -> permitido
token sin permiso -> 403
```

---

## 73. Quinto milestone

Redis + rate limiting.

Prioridad:

```text
login
2FA verify
2FA resend
general API
```

---

## 74. Sexto milestone

WebSocket proxy:

```text
Client
 |
 v
Gateway
 |
 v
Notification Service
```

JWT + rooms derivados de identidad.

---

## 75. Séptimo milestone

Observabilidad:

```text
Prometheus
Grafana
latency metrics
proxy errors
correlation IDs
```

---

## 76. Octavo milestone

Hardening:

```text
graceful shutdown
CORS
Helmet
body limits
timeouts
trusted proxy
secret management
```

---

## 77. Noveno milestone

Docker Compose integrado con:

```text
Gateway
Auth
Customer
Notification
RabbitMQ
Redis
PostgreSQL
Elasticsearch
Prometheus
Grafana
```

según los módulos activos.

---

## 78. Décimo milestone

Kubernetes local:

```text
Ingress
 |
 v
Gateway replicas
 |
 +--> Auth replicas
 +--> Customer replicas
 +--> Notification replicas
```

Después:

```text
HPA
load balancing
autoscaling
rolling updates
```

---

## 79. Diagrama objetivo

```text
                         Internet / Client
                                |
                                v
                    +-----------------------+
                    |      API Gateway      |
                    |-----------------------|
                    | Correlation ID        |
                    | Logging               |
                    | Rate Limiting         |
                    | JWT Verification      |
                    | Permission Guard      |
                    | Security Headers      |
                    | HTTP Proxy            |
                    | WebSocket Proxy       |
                    | Metrics               |
                    +-----------+-----------+
                                |
           +--------------------+--------------------+
           |                    |                    |
           v                    v                    v
 +----------------+   +------------------+   +----------------------+
 |  Auth Service  |   | Customer Service |   | Notification Service |
 +----------------+   +------------------+   +----------------------+
           |                                        |
           |                                        |
           v                                        v
     PostgreSQL                                  PostgreSQL
           |
           v
        Outbox
           |
           v
   LISTEN / NOTIFY
           |
           v
    Outbox Worker
           |
           v
      RabbitMQ
           |
           +-------------------------------------->
                                  Notification Service
                                           |
                                           v
                                     Email / Socket
```

---

## 80. Flujo HTTP autenticado

```text
Client
 |
 | GET /api/v1/customers/12
 | Authorization: Bearer ...
 v
Gateway
 |
 +--> security headers
 +--> correlation ID
 +--> rate limit
 +--> verify JWT
 +--> extract identity
 +--> check customers.read
 +--> sanitize headers
 +--> add trusted internal headers
 |
 v
Customer Service
 |
 +--> domain validation
 +--> use case
 +--> repository
 |
 v
PostgreSQL
 |
 v
Response
 |
 v
Gateway
 |
 +--> log status + duration
 |
 v
Client
```

---

## 81. Definition of Done

La primera versión seria puede considerarse terminada cuando:

- Gateway es el punto HTTP público.
- Auth está detrás del Gateway.
- Customer está detrás del Gateway.
- Notification está detrás del Gateway.
- `/health` funciona.
- Routing HTTP funciona.
- Correlation ID se genera y propaga.
- Logging es estructurado.
- JWT se valida.
- Rutas públicas y protegidas están separadas.
- Permissions se validan.
- Rate limiting usa Redis.
- Timeouts están activos.
- Upstream errors se manejan correctamente.
- CORS está configurado.
- Security headers están activos.
- Secrets no aparecen en logs.
- WebSocket llega a Notification Service.
- Rooms no son escogidos por el cliente.
- Prometheus expone métricas.
- Graceful shutdown funciona.
- Existen tests de auth, permissions, proxy y fallos.
- Docker Compose integra el Gateway.
- La documentación deja claros límites y responsabilidades.

---

## 82. Orden recomendado para StreamCRM

```text
1. Crear gateway-service
2. Express + environment
3. GET /health
4. Proxy Auth
5. Proxy Customer
6. Proxy Notification
7. Probar todo desde Postman usando solo Gateway
8. Correlation ID
9. Structured logging
10. Timeout + proxy errors
11. JWT verification
12. Public/protected routes
13. Permission guards
14. Redis rate limiting
15. Helmet + CORS
16. WebSocket proxy
17. Metrics
18. Graceful shutdown
19. Tests
20. Docker
21. Kubernetes
22. OpenTelemetry
```

Regla de construcción:

```text
primero routing
después seguridad
después resiliencia
después observabilidad
después scaling
```

---

## 83. Resultado esperado

Al finalizar:

```text
                StreamCRM
                    |
             +-------------+
             | API Gateway |
             +-------------+
                    |
         +----------+----------+
         |          |          |
        Auth     Customer  Notification
```

El cliente deja de conocer:

```text
localhost:3000
localhost:3001
localhost:3002
```

y utiliza únicamente:

```text
http://localhost:8080
```

Más adelante:

```text
https://api.streamcrm.example.com
```

Los microservicios quedan detrás de la infraestructura interna.

El Gateway se convierte en la frontera externa de StreamCRM mientras cada servicio conserva la autoridad sobre su propio dominio.
