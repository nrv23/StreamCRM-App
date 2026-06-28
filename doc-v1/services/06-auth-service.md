# 06 - Auth Service

## Responsabilidad

El Auth Service gestiona autenticación, autorización, sesiones, roles y permisos.

## Tecnologías

- Node.js.
- TypeScript.
- Express.
- PostgreSQL.
- Redis.
- JWT.
- bcrypt o argon2.

## Entidades principales

- users.
- roles.
- permissions.
- role_permissions.
- user_roles.
- refresh_tokens.
- sessions.

## Features

### Login

Flujo:

```text
User credentials
 -> Validate input
 -> Find user
 -> Compare password hash
 -> Create access token
 -> Create refresh token
 -> Store session
 -> Return tokens
```

### Refresh Token

Valida:

- Token existente.
- Token no revocado.
- Usuario activo.
- Sesión activa.

### Logout

Acciones:

- Revocar refresh token.
- Eliminar session cache.
- Publicar evento `auth.user.logged_out`.

### Roles

Roles iniciales:

- Admin.
- Supervisor.
- Agent.

### Permisos

Ejemplos:

```text
customers:create
customers:read
customers:update
customers:delete
campaigns:create
campaigns:start
tickets:assign
reports:export
```

### Cache de permisos

Key sugerida:

```text
auth:permissions:user:{userId}
```

TTL sugerido:

```text
15 minutos
```

## Eventos publicados

### auth.user.logged_in

```json
{
  "eventId": "uuid",
  "eventName": "auth.user.logged_in",
  "occurredAt": "date",
  "correlationId": "uuid",
  "payload": {
    "userId": "uuid",
    "sessionId": "uuid"
  }
}
```

### auth.user.logged_out

```json
{
  "eventId": "uuid",
  "eventName": "auth.user.logged_out",
  "occurredAt": "date",
  "correlationId": "uuid",
  "payload": {
    "userId": "uuid",
    "sessionId": "uuid"
  }
}
```

## Patrones aplicados

- Repository Pattern.
- Strategy Pattern.
- Cache Aside.
- Factory Pattern.

## Tablas PostgreSQL sugeridas

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  revoked_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```
