# StreamCRM — Auth Service + API Gateway

## 1. Objetivo general

El objetivo de este módulo es agregar una capa completa de identidad, autenticación, autorización y enrutamiento centralizado al sistema StreamCRM.

Hasta este punto, los microservicios pueden funcionar de forma relativamente aislada. Con Auth Service + API Gateway, el sistema comienza a comportarse como una plataforma completa:

```text
Frontend / Postman / Mobile
          ↓
      API Gateway
          ↓
 ┌────────┼───────────────┐
 ↓        ↓               ↓
Auth     Customer       Ticket
Service  Service        Service
          ↓
      RabbitMQ / Redis / ...
```

La idea principal es separar correctamente responsabilidades:

```text
API Gateway
→ frontera de entrada al sistema
→ routing
→ autenticación básica
→ autorización coarse-grained
→ rate limiting
→ propagación de identidad
→ observabilidad de entrada

Auth Service
→ autoridad de identidad
→ usuarios
→ credenciales
→ roles
→ permisos
→ sesiones
→ access tokens
→ refresh tokens
→ revocación
```

El Gateway no debe convertirse en un microservicio de negocio.

El Auth Service no debe convertirse en un proxy.

---

# 2. Auth Service

## Base de datos

```text
auth_db
```

## Responsabilidad

Gestionar:

- usuarios;
- credenciales;
- roles;
- permisos;
- sesiones;
- access tokens;
- refresh tokens;
- revocación;
- cambios de permisos;
- cache de autorización;
- eventos relacionados con autenticación e identidad.

---

# 3. Modelo de datos

## Tablas

```text
users
roles
permissions
user_roles
role_permissions
refresh_tokens
outbox_events
```

## Relaciones

```text
users N:M roles
roles N:M permissions
users 1:N refresh_tokens
```

## SQL inicial

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  external_id UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(150) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id INT NOT NULL REFERENCES users(id),
  role_id INT NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL REFERENCES roles(id),
  permission_id INT NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  revoked_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id
ON refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_expires_at
ON refresh_tokens(expires_at);
```

---

# 4. Transactional Outbox

Cada servicio tiene su propia tabla `outbox_events`.

```sql
CREATE TABLE outbox_events (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  event_name VARCHAR(150) NOT NULL,
  aggregate_id INT NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  published_at TIMESTAMP NULL,
  CHECK (status IN ('pending', 'published', 'failed'))
);

CREATE INDEX idx_outbox_events_status_created_at
ON outbox_events(status, created_at);
```

## Propósito

Evitar el clásico problema:

```text
PostgreSQL COMMIT ✅
RabbitMQ publish ❌
```

El flujo correcto es:

```text
BEGIN
  INSERT/UPDATE entidad
  INSERT outbox_events
COMMIT

Outbox Publisher
  ↓
lee eventos pending
  ↓
publica en RabbitMQ
  ↓
marca published
```

De esta forma la transacción de negocio y la intención de publicar el evento quedan persistidas de manera atómica.

---

# 5. Eventos del Auth Service

## Eventos publicados

```text
auth.user.created
auth.user.logged_in
auth.user.logged_out
auth.permissions.changed
```

### auth.user.created

Se publica cuando un usuario se crea correctamente.

Puede servir en el futuro para:

- auditoría;
- notificaciones;
- sincronización de read models;
- provisioning;
- métricas.

### auth.user.logged_in

Puede utilizarse para:

- auditoría;
- seguridad;
- analytics;
- detección de actividad.

### auth.user.logged_out

Permite registrar y distribuir el cierre de sesión.

### auth.permissions.changed

Especialmente importante para invalidar caches de permisos.

Ejemplo:

```text
admin modifica rol/permisos de user:18
↓
Auth Service actualiza PostgreSQL
↓
outbox
↓
auth.permissions.changed
↓
invalidación cache
```

## Eventos consumidos

Inicialmente:

```text
ninguno
```

El Auth Service puede comenzar siendo principalmente productor.

---

# 6. APIs

```http
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id/status
```

---

# 7. Login

Request:

```http
POST /api/v1/auth/login
```

Ejemplo:

```json
{
  "email": "user@test.com",
  "password": "123456"
}
```

Flujo:

```text
Client
↓
API Gateway
↓
Auth Service
↓
buscar user por email
↓
validar status
↓
verificar password
↓
resolver roles
↓
resolver permisos
↓
crear sesión
↓
crear access token
↓
crear refresh token
↓
guardar hash refresh token
↓
responder
```

Respuesta conceptual:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 900
}
```

---

# 8. Password hashing

El password nunca se almacena en texto plano.

```text
password_hash
```

Conviene abstraer hashing mediante Strategy:

```text
PasswordHasher
├── hash(password)
└── verify(password, hash)
```

---

# 9. Access Token

Ejemplo conceptual:

```json
{
  "sub": "external-user-id",
  "user_id": 18,
  "session_id": "session-id",
  "roles": ["administrator"],
  "iat": 123,
  "exp": 456
}
```

No necesariamente conviene almacenar todos los permisos dentro del JWT si pueden cambiar frecuentemente.

---

# 10. Firma asimétrica del JWT

```text
Auth Service
→ private key
→ firma JWT

API Gateway
→ public key
→ verifica JWT
```

Ventaja:

```text
Gateway puede verificar tokens
pero no puede crear tokens válidos
```

---

# 11. Refresh Tokens

```text
refresh token recibido
↓
calcular hash
↓
buscar en auth_db
↓
¿existe?
↓
¿está revocado?
↓
¿expiró?
↓
¿usuario sigue activo?
↓
rotar token
↓
nuevo access token
↓
nuevo refresh token
```

---

# 12. Refresh Token Rotation

```text
Refresh A
↓
validar
↓
revocar A
↓
crear Refresh B
↓
crear nuevo Access Token
```

---

# 13. Logout

```http
POST /api/v1/auth/logout
```

Flujo:

```text
Client
↓
Gateway
↓
Auth Service
↓
identificar refresh/session
↓
revoked_at = now()
↓
invalidar sesión Redis
↓
outbox auth.user.logged_out
```

---

# 14. Redis en Auth Service

Se proponen:

```text
auth:permissions:user:{userId}
auth:session:{sessionId}
auth:login:attempts:{email}
```

---

# 15. Cache de permisos

```text
auth:permissions:user:18
```

Modelo Cache Aside:

```text
request permissions user:18
↓
Redis GET
├── HIT
│   ↓
│ permisos
│
└── MISS
    ↓
PostgreSQL
    ↓
resolver permisos
    ↓
Redis SET
    ↓
respuesta
```

Cuando cambian permisos:

```text
Auth Service
↓
PostgreSQL
↓
auth.permissions.changed
↓
invalidar auth:permissions:user:{id}
```

---

# 16. Session Cache

```text
auth:session:{sessionId}
```

Ejemplo:

```json
{
  "user_id": 18,
  "status": "active"
}
```

Flujo:

```text
JWT válido
↓
session_id
↓
Redis
↓
session active?
├── NO → 401
└── SÍ → continuar
```

---

# 17. Login attempts

```text
auth:login:attempts:{email}
```

Sirve para:

- rate limiting;
- brute force protection;
- bloqueo temporal;
- backoff.

---

# 18. API Gateway

El API Gateway es la frontera externa.

El cliente no necesita conocer:

```text
auth-service:3001
customer-service:3002
ticket-service:3003
notification-service:3004
```

Solo conoce un endpoint público.

---

# 19. Routing

```text
/api/v1/auth/*
→ Auth Service

/api/v1/users/*
→ Auth Service

/api/v1/customers/*
→ Customer Service

/api/v1/tickets/*
→ Ticket Service
```

---

# 20. Login a través del Gateway

```text
Frontend
↓
POST /api/v1/auth/login
↓
API Gateway
↓
Auth Service
↓
PostgreSQL
↓
access token + refresh token
↓
Gateway
↓
Frontend
```

---

# 21. Request autenticado

```http
GET /api/v1/customers
Authorization: Bearer ACCESS_TOKEN
```

Flujo:

```text
Client
↓
API Gateway
↓
extraer Bearer token
↓
verificar JWT
├── inválido → 401
└── válido
    ↓
extraer identidad
    ↓
validar sesión
    ↓
validar autorización
    ↓
Customer Service
```

---

# 22. Qué valida el Gateway

```text
firma JWT
expiration
issuer
audience
claims básicos
session
permisos generales
rate limits
```

---

# 23. Evitar llamar al Auth Service por request

No queremos:

```text
Client
↓
Gateway
↓
Auth Service
↓
"¿este token es válido?"
↓
Customer Service
```

para cada request.

Eso crea:

```text
latencia extra
bottleneck
acoplamiento
single point of failure
```

Con JWT:

```text
Auth Service
→ firma

Gateway
→ verifica localmente
```

---

# 24. Propagación de identidad

Una vez validado el JWT:

```http
X-User-Id: 18
X-Session-Id: abc
X-Request-Id: ...
```

Regla crítica:

```text
Nunca confiar en esos headers si vienen directamente del cliente.
```

El Gateway debe eliminarlos y reconstruirlos desde identidad confiable.

---

# 25. Authorization: Gateway vs Microservice

## Gateway

Autorización coarse-grained:

```text
GET /customers
→ customers.read

POST /customers
→ customers.create

PATCH /users/:id/status
→ users.status.change
```

## Microservicio

Autorización contextual de negocio:

```text
¿puede modificar ESTE customer?
¿pertenece al tenant?
¿tiene acceso al país?
¿es owner?
```

---

# 26. Roles y permisos

```text
user 18
↓
administrator
↓
customers.read
customers.write
tickets.read
users.manage
```

Modelo:

```text
users
↓
user_roles
↓
roles
↓
role_permissions
↓
permissions
```

---

# 27. Cambio de permisos

```text
admin quita customers.write a user 18
↓
Auth Service
↓
PostgreSQL
↓
outbox
↓
auth.permissions.changed
↓
invalidar cache
```

---

# 28. Usuario bloqueado con JWT válido

Problema:

```text
JWT válido por 15 minutos
↓
admin bloquea user 18
```

Solución conceptual:

```text
JWT
+
session check
```

```text
JWT signature ✅
JWT expiration ✅
↓
session_id
↓
Redis
↓
session active?
├── NO → 401
└── SÍ → continuar
```

---

# 29. Patrones del Auth Service

- Repository
- Strategy para hashing
- Factory para token service
- Cache Aside
- Chain of Responsibility para middlewares

Ejemplo:

```text
extract token
↓
verify JWT
↓
verify session
↓
resolve permissions
↓
authorize request
```

---

# 30. Estructura interna del Auth Service

```text
auth-service/

src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Permission.ts
│   │   └── RefreshToken.ts
│   ├── repositories/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   │   ├── LoginUseCase.ts
│   │   ├── RefreshTokenUseCase.ts
│   │   ├── LogoutUseCase.ts
│   │   ├── GetMeUseCase.ts
│   │   ├── CreateUserUseCase.ts
│   │   └── ChangeUserStatusUseCase.ts
│   └── services/
│       └── PermissionResolver.ts
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── rabbitmq/
│   ├── security/
│   │   ├── PasswordHasher.ts
│   │   └── TokenService.ts
│   └── outbox/
│
└── presentation/
    ├── controllers/
    ├── routes/
    └── middlewares/
```

---

# 31. Estructura del API Gateway

```text
api-gateway/

src/
├── routing/
├── security/
│   ├── jwt.middleware.ts
│   ├── session.middleware.ts
│   ├── permission.middleware.ts
│   └── rate-limit.middleware.ts
├── proxy/
├── redis/
├── observability/
├── config/
└── main.ts
```

---

# 32. El Gateway no debe contener lógica de negocio

Evitar:

```text
Gateway
→ modificar customers
→ calcular campañas
→ decidir estados de tickets
→ lógica de dominio
```

El Gateway debe encargarse de:

```text
frontera
routing
seguridad
observabilidad
control de tráfico
```

---

# 33. Integración con Socket.IO

Hoy el laboratorio usa algo parecido a:

```text
/notifications?room=user:18
```

La implementación final debería ser:

```text
Socket client
↓
JWT handshake
↓
verificar token
↓
extraer userId
↓
SocketServer
↓
socket.join("ws:user:18")
```

El servidor decide el room.

---

# 34. Rooms del Notification Service

```text
ws:user:{userId}
ws:campaign:{campaignId}
ws:import:{batchId}
```

`ws:user:{userId}` se usa para notificaciones directas.

Los rooms de campaign/import se incorporan cuando existan sus microservicios y reglas de autorización correspondientes.

---

# 35. Flujo completo Gateway + Auth + Customer + Notification

## Login

```text
Frontend
↓
Gateway
↓
Auth Service
↓
auth_db
↓
access + refresh
↓
Frontend
```

## Update Customer

```text
Frontend
↓
Authorization: Bearer JWT
↓
API Gateway
↓
verify JWT
↓
verify session
↓
verify permission
↓
Customer Service
↓
PostgreSQL transaction
├── update customer
└── outbox event
↓
Outbox Publisher
↓
RabbitMQ
↓
Notification Service
↓
persist notification
↓
Redis Emitter
↓
Redis
↓
Socket.IO Redis Adapter
↓
ws:user:{userId}
↓
Frontend recibe realtime
```

---

# 36. Responsabilidades por componente

```text
API Gateway
→ entrada externa
→ routing
→ JWT verification
→ session validation
→ coarse permissions
→ rate limiting

Auth Service
→ identidad
→ passwords
→ roles
→ permissions
→ sessions
→ access tokens
→ refresh tokens
→ revocation

Customer Service
→ dominio customers

RabbitMQ
→ integración durable/event-driven

Notification Service
→ persistencia y delivery de notifications

Redis
→ cache/auth state
→ realtime distribution

Socket.IO
→ entrega final realtime

PostgreSQL
→ source of truth
```

---

# 37. Roadmap recomendado de implementación

```text
1. Users + Roles + Permissions
2. Password hashing
3. Login
4. Access Token JWT
5. Refresh Tokens
6. Refresh Token Rotation
7. Logout / Revocation
8. GET /auth/me
9. Cache permissions
10. Session cache
11. Login attempts / rate limiting
12. Outbox events Auth
13. API Gateway routing
14. Gateway JWT validation
15. Gateway session validation
16. Gateway permission middleware
17. Integración Gateway → Customer Service
18. Socket authentication
19. Flujo completo end-to-end
```

---

# 38. Qué no hacer todavía

Evitar sobrecargar esta fase con:

```text
100% test coverage
Campaign websocket authorization
Import websocket authorization
OpenTelemetry completo
documentación exhaustiva
decenas de métricas nuevas
features que todavía no tienen servicios productores
```

Primero:

```text
hacer funcionar identidad + gateway + flujo completo
```

Luego:

```text
hardening
tests
docs
metrics
tracing
security review
```

---

# 39. Resultado esperado

```text
login
↓
access token + refresh token
↓
Gateway
↓
JWT verification
↓
session validation
↓
permission validation
↓
microservice
↓
event-driven workflow
↓
Notification Service
↓
distributed realtime
```

Con eso StreamCRM empieza a operar como una plataforma completa con:

```text
identidad
seguridad
autorización
routing
mensajería
persistencia
cache
realtime distribuido
observabilidad
```

---

# 40. Resumen arquitectónico final

```text
                         CLIENT
                           │
                           ▼
                     API GATEWAY
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          AUTH          CUSTOMER       TICKET
         SERVICE         SERVICE       SERVICE
             │             │
             ▼             ▼
          auth_db      customer_db
             │             │
             │          OUTBOX
             │             │
             │             ▼
             │         RabbitMQ
             │             │
             │             ▼
             │      NOTIFICATION SERVICE
             │             │
             │             ├── PostgreSQL
             │             │
             │             └── Redis Emitter
             │                     │
             └──────── Redis ◄─────┘
                         │
                         ▼
                 Socket.IO Adapter
                         │
                         ▼
                  ws:user:{userId}
                         │
                         ▼
                       CLIENT
```

La idea central:

```text
Auth Service
→ sabe quién eres y qué puedes hacer.

API Gateway
→ controla cómo entras al sistema.

Microservicios
→ ejecutan las reglas de negocio.

RabbitMQ
→ mueve eventos durables.

PostgreSQL
→ conserva el estado real.

Redis
→ acelera autorización y distribuye realtime.

Socket.IO
→ entrega eventos al usuario.
```
