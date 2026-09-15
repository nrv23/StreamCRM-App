# StreamCRM Auth Service — Access Tokens, Refresh Tokens y Sesiones Revocables

## 1. Objetivo

El Auth Service manejará tres ciclos de vida diferentes:

```text
Access Token
→ autenticación de corta duración

Refresh Token
→ permite renovar access tokens

Session
→ representa la sesión completa del usuario
```

Estos tres elementos están relacionados, pero no deben tratarse como si fueran lo mismo.

---

## 2. Arquitectura general

```text
JWT
→ identidad

Redis Session
→ valida si la sesión sigue viva

Redis Permissions
→ valida qué puede hacer el usuario

PostgreSQL
→ source of truth + auditoría + trazabilidad
```

El API Gateway usará principalmente JWT + Redis durante cada request.

PostgreSQL no debe consultarse en cada request.

---

## 3. Access Token

El Access Token será un JWT de corta duración.

Ejemplo:

```json
{
  "sub": "3f5757b1-fde3-4bf4-bbd7-2056fd3b80c6",
  "uid": 6,
  "sid": "550e8400-e29b-41d4-a716-446655440000",
  "iss": "streamcrm-auth",
  "aud": "streamcrm",
  "iat": 123456789,
  "exp": 123457689
}
```

Campos:

```text
sub → external_id del usuario
uid → id interno
sid → sessionId
iat → fecha de emisión
exp → expiración de ese Access Token
```

El JWT no necesita contener roles, permissions, email o nombre.

---

## 4. Duraciones recomendadas

```text
Access Token  → 15 minutos
Refresh Token → 7 días
Session       → 7 días
```

Ejemplo:

```env
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
SESSION_TTL_DAYS=7
```

---

## 5. Diferencia entre los tres tiempos

```text
JWT exp
→ mata únicamente ese Access Token

refresh_tokens.expires_at
→ mata la capacidad de renovar tokens

auth_sessions.expires_at
→ mata toda la sesión
```

Ejemplo:

```text
LOGIN 10:00

Session
→ 10:00 hasta 7 días después

Refresh Token
→ 10:00 hasta 7 días después

Access Token #1
→ 10:00 hasta 10:15
```

Cuando el Access Token expira, la sesión puede seguir activa. El Refresh Token permite generar otro Access Token mientras la sesión continúe válida.

---

## 6. Sesión revocable

Cada login genera un `sessionId` único.

Ese `sessionId` se incluye en el JWT:

```text
sid = sessionId
```

Esto permite que el Gateway valide:

```text
¿el JWT es válido?
↓
¿la sesión todavía existe?
```

---

## 7. Tabla auth_sessions

```sql
CREATE TABLE auth_sessions (
    id SERIAL PRIMARY KEY,

    session_id UUID NOT NULL UNIQUE,

    user_id INT NOT NULL REFERENCES users(id),

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    ip_address INET NULL,

    user_agent TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT now(),

    expires_at TIMESTAMP NOT NULL,

    last_seen_at TIMESTAMP NULL,

    ended_at TIMESTAMP NULL,

    revoked_at TIMESTAMP NULL,

    revoke_reason VARCHAR(255) NULL,

    CHECK (status IN ('active', 'revoked', 'expired'))
);

CREATE INDEX idx_auth_sessions_user_id
ON auth_sessions(user_id);

CREATE INDEX idx_auth_sessions_session_id
ON auth_sessions(session_id);

CREATE INDEX idx_auth_sessions_user_status
ON auth_sessions(user_id, status);
```

PostgreSQL conserva historial, trazabilidad y auditoría.

---

## 8. Función de Redis

Cuando se crea una sesión también se guarda:

```text
auth:session:{sessionId}
```

Ejemplo:

```json
{
  "user_id": 6,
  "status": "active"
}
```

Ese key tiene TTL igual a la duración de la sesión.

```text
TTL llega a 0
↓
Redis elimina la key
↓
Gateway deja de aceptar esa sesión
```

---

## 9. Crear una sesión

Durante login:

```text
email + password
↓
Auth Service valida credenciales
↓
genera sessionId
↓
calcula sessionExpiresAt
↓
INSERT auth_sessions
↓
SET Redis auth:session:{sid} con TTL
↓
crea Access Token con sid
↓
crea Refresh Token asociado a sid
↓
response
```

Ejemplo TypeScript:

```ts
const sessionId = randomUUID();

const sessionExpiresAt = new Date(
  Date.now() +
  SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
);
```

---

## 10. Refresh Token asociado a sesión

Conceptualmente:

```text
refresh_tokens
--------------
id
user_id
session_id
token_hash
revoked_at
expires_at
created_at
```

Ejemplo:

```text
SESSION A
├── Access Token A1
├── Access Token A2
├── Access Token A3
└── Refresh Token A
```

Otra sesión puede tener su propio Refresh Token y sus propios Access Tokens.

---

## 11. Validación en API Gateway

Cada request protegida:

```text
REQUEST
↓
API Gateway
↓
validar JWT
├── firma
├── exp
├── issuer
└── audience
↓
extraer uid + sid
↓
Redis
auth:session:{sid}
↓
¿existe?
├── NO → 401
└── SÍ
     ↓
Redis
auth:permissions:user:{uid}
     ↓
¿tiene permission requerido?
├── NO → 403
└── SÍ
     ↓
Microservicio
```

Esto separa:

```text
JWT
→ identidad

Session Redis
→ ¿la sesión sigue viva?

Permissions Redis
→ ¿qué puede hacer?
```

---

## 12. 401 vs 403

```text
401
→ token inválido
→ token expirado
→ sesión inexistente
→ sesión revocada
```

```text
403
→ identidad válida
→ sesión válida
→ pero sin permission requerido
```

---

## 13. Expiración natural de sesión

Redis resuelve la expiración runtime mediante TTL.

PostgreSQL puede mantener el estado histórico usando un worker:

```text
Session Expiration Worker
↓
cada 1-5 minutos
↓
PostgreSQL
```

```sql
UPDATE auth_sessions
SET
    status = 'expired',
    ended_at = NOW()
WHERE status = 'active'
  AND expires_at <= NOW();
```

El worker es idempotente porque solo procesa sesiones activas.

---

## 14. Revocación explícita

Cuando la sesión termina por logout, actividad sospechosa, bloqueo o acción administrativa:

```sql
UPDATE auth_sessions
SET
    status = 'revoked',
    revoked_at = NOW(),
    ended_at = NOW(),
    revoke_reason = $2
WHERE session_id = $1
  AND status = 'active';
```

Luego:

```text
DEL auth:session:{sessionId}
```

El JWT puede seguir criptográficamente válido, pero el Gateway responderá `401` porque la sesión ya no existe en Redis.

---

## 15. Logout inmediato

```text
logout
↓
revocar Refresh Token
↓
revocar auth_session
↓
DEL Redis session
↓
Access Token queda inutilizable inmediatamente
```

---

## 16. Múltiples dispositivos

```text
user 6

├── session A
│   └── Chrome / Linux
│
└── session B
    └── Android
```

Cada sesión tiene:

```text
sessionId propio
Refresh Token propio
Access Tokens propios
Redis key propia
```

Se puede revocar una sesión sin afectar las demás.

---

## 17. Usuario bloqueado

```text
PATCH user → blocked
↓
Auth Service
↓
revocar todas las sesiones activas
↓
revocar Refresh Tokens
↓
eliminar sesiones Redis
```

Ejemplo:

```sql
UPDATE auth_sessions
SET
    status = 'revoked',
    revoked_at = NOW(),
    ended_at = NOW(),
    revoke_reason = 'user_blocked'
WHERE user_id = $1
  AND status = 'active';
```

---

## 18. Actividad sospechosa

Una sesión específica puede revocarse por seguridad:

```text
PostgreSQL
→ status = revoked
→ revoke_reason = suspicious_activity

Redis
→ DEL auth:session:{sid}
```

Las demás sesiones del usuario continúan activas.

---

## 19. Endpoint futuro de sesiones

```http
GET /api/v1/auth/sessions
```

Puede devolver:

```json
[
  {
    "session_id": "...",
    "device": "Chrome / Linux",
    "status": "active",
    "created_at": "...",
    "expires_at": "..."
  }
]
```

También:

```http
DELETE /api/v1/auth/sessions/:sessionId
```

para cerrar una sesión concreta.

---

## 20. last_seen_at

No conviene actualizar `last_seen_at` en cada request porque generaría demasiadas escrituras.

Puede actualizarse cada cierto intervalo o de manera asíncrona.

---

## 21. Expiración absoluta

Para la primera versión:

```text
login
↓
7 días
↓
la sesión termina
```

Aunque el usuario permanezca activo durante toda la semana.

Es más fácil de razonar, auditar y asegurar.

---

## 22. Sesión deslizante — futuro

Una alternativa futura sería extender TTL y `expires_at` con actividad válida.

No se recomienda inicialmente porque agrega sincronización entre Redis, PostgreSQL, Refresh Token y actividad del usuario.

---

## 23. Flujo completo de login

```text
POST /auth/login
↓
validar DTO
↓
buscar user
↓
PBKDF2 verify
↓
validar user.status
↓
obtener roles
↓
obtener effective permissions
↓
crear sessionId
↓
INSERT auth_sessions
↓
Redis SET auth:session:{sid} + TTL
↓
Redis SET auth:permissions:user:{uid}
↓
crear Access Token
↓
crear Refresh Token
↓
guardar hash del Refresh Token
↓
response
```

---

## 24. Response de login

```json
{
  "success": true,
  "response": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 900,
    "user": {
      "id": 6,
      "external_id": "3f5757b1-fde3-4bf4-bbd7-2056fd3b80c6",
      "email": "test@gmail.com",
      "status": "active"
    },
    "roles": [
      {
        "id": 1,
        "name": "viewer"
      }
    ],
    "permissions": [
      "customers.read",
      "tickets.read",
      "reports.read"
    ]
  }
}
```

Frontend:

```text
roles + permissions
→ UI
```

Gateway:

```text
JWT + Redis
→ seguridad real
```

---

## 25. Flujo de refresh

```text
POST /auth/refresh
↓
buscar Refresh Token
↓
validar hash
↓
¿revoked_at = null?
↓
¿expires_at > now?
↓
obtener sessionId
↓
Redis auth:session:{sid}
↓
¿sesión existe?
├── NO → 401
└── SÍ
     ↓
crear nuevo Access Token
```

Idealmente puede usarse Refresh Token Rotation:

```text
Refresh A
↓
validar
↓
revocar A
↓
crear Refresh B
↓
nuevo Access Token
```

---

## 26. Flujo de logout

```text
POST /auth/logout
↓
identificar sesión
↓
revocar Refresh Token
↓
UPDATE auth_sessions → revoked
↓
DEL auth:session:{sid}
↓
response
```

---

## 27. Responsabilidades finales

```text
Access Token
→ prueba criptográfica de identidad
→ corta duración

Refresh Token
→ permite renovar Access Tokens
→ persistido como hash
→ revocable

Session
→ representa el login completo
→ revocable
→ multi-device
→ trazabilidad

Redis Session
→ enforcement rápido

PostgreSQL auth_sessions
→ historial y auditoría

Redis Permissions
→ autorización dinámica

API Gateway
→ valida JWT + session + permission
```

---

## 28. Regla arquitectónica final

```text
JWT
→ quién eres

Session
→ si todavía puedes usar esa autenticación

Permissions
→ qué puedes hacer

PostgreSQL
→ qué ocurrió históricamente

Redis
→ decisión rápida en runtime
```
