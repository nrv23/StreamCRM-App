# StreamCRM Auth Service — Política de Roles, Permisos y Roles Custom

## 1. Objetivo

Esta es una de las piezas más importantes del Auth Service de StreamCRM.

La idea central es separar claramente:

```text
Permission
→ capacidad concreta del sistema

Role
→ agrupación de permissions

UserRole
→ asignación de roles a usuarios

RolePermission
→ composición de permissions dentro de un role
```

La autorización real del sistema se basa en **permissions**, no en nombres de roles.

El nombre del role sirve como agrupación administrativa y funcional.

---

# 2. Principio principal

Nunca autorizar una operación solamente con:

```ts
if (role === 'administrator') {
  // permitir
}
```

La pregunta correcta es:

```text
¿El usuario tiene el permission necesario?
```

Por ejemplo:

```http
POST /api/v1/users
```

requiere:

```text
users.create
```

Entonces:

```text
JWT válido
↓
resolver permissions efectivos
↓
¿users.create?
├── sí → continuar
└── no → 403 Forbidden
```

---

# 3. Roles base del sistema

Inicialmente StreamCRM tendrá algunos roles del sistema:

```text
viewer
operator
administrator
superadmin
```

Estos roles existen como configuración base del sistema.

Cada uno tiene una política de permissions permitidos.

Ejemplo conceptual:

```ts
const ROLE_PERMISSION_POLICY = {
  viewer: [
    'customers.read',
    'tickets.read',
    'campaigns.read',
    'imports.read',
    'reports.read',
    'notifications.read',
  ],

  operator: [
    'customers.read',
    'customers.create',
    'customers.update',

    'tickets.read',
    'tickets.create',
    'tickets.update',

    'campaigns.read',

    'imports.read',
    'imports.create',

    'reports.read',

    'notifications.read',
  ],

  administrator: [
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',

    'tickets.read',
    'tickets.create',
    'tickets.update',
    'tickets.assign',

    'campaigns.read',
    'campaigns.create',
    'campaigns.update',

    'imports.read',
    'imports.create',

    'reports.read',
    'reports.create',

    'notifications.read',

    'users.read',
    'users.create',
    'users.update_status',

    'roles.read',
  ],

  superadmin: '*',
};
```

La idea no es necesariamente que esta configuración sea la fuente de verdad permanente de runtime.

Su función principal es:

```text
bootstrap
+
policy
+
restricción de permisos máximos permitidos
```

---

# 4. Permissions como catálogo fijo

Los permissions son capacidades que el sistema conoce.

Ejemplos:

```text
customers.read
customers.create
customers.update
customers.delete

tickets.read
tickets.create
tickets.update
tickets.assign

campaigns.read
campaigns.create
campaigns.update

imports.read
imports.create

reports.read
reports.create

notifications.read

users.read
users.create
users.update_status

roles.read
roles.manage
```

Los permissions deben existir previamente en la base de datos.

Normalmente se cargan mediante:

```text
migration
o
seed
```

No deberían crearse libremente desde UI.

La razón es simple:

```text
permission
→ representa una capacidad que el backend realmente entiende
```

---

# 5. Role = agrupación administrativa

Un role no representa directamente una autorización.

Representa un conjunto de permissions.

Ejemplo:

```text
operator
├── customers.read
├── customers.create
├── customers.update
├── tickets.read
├── tickets.create
├── tickets.update
├── reports.read
└── notifications.read
```

La API no pregunta:

```text
¿es operator?
```

Pregunta:

```text
¿tiene customers.update?
```

---

# 6. Roles base y límites de permisos

Los roles base deben tener una política de permisos máximos permitidos.

Ejemplo:

```text
viewer
→ solamente lectura operativa

operator
→ lectura + operaciones comunes del CRM

administrator
→ operaciones + gestión de usuarios

superadmin
→ todos los permissions
```

Esto evita que alguien convierta accidentalmente:

```text
viewer
```

en algo equivalente a:

```text
superadmin
```

---

# 7. Política de UI para roles base

Cuando la UI abre:

```text
Edit Role: viewer
```

no debería mostrar como asignables todos los permissions del sistema.

Debe mostrar solamente aquellos permitidos por la policy del role.

Ejemplo:

```text
viewer
```

puede tener:

```text
customers.read
tickets.read
campaigns.read
imports.read
reports.read
notifications.read
```

Pero no:

```text
customers.update
users.create
roles.manage
```

La UI puede usar la policy para:

```text
habilitar checkboxes permitidos
ocultar permissions prohibidos
deshabilitar opciones
```

---

# 8. La UI no es seguridad

Aunque React esconda permissions no válidos, un cliente malicioso podría intentar llamar directamente al endpoint.

Por ejemplo:

```http
PATCH /api/v1/roles/1/permissions
```

y enviar:

```json
{
  "permissions": [
    "roles.manage"
  ]
}
```

Por eso el Auth Service debe volver a validar todo.

Regla:

```text
UI
→ experiencia de usuario

API
→ seguridad real
```

---

# 9. Roles custom

StreamCRM puede permitir crear roles personalizados.

Ejemplos:

```text
supervisor
customer_manager
readonly_support
campaign_manager
report_manager
```

Un custom role no necesita estar "por encima" o "por debajo" de otro role.

Su poder depende exclusivamente de los permissions que tenga.

---

# 10. Regla principal para custom roles

Un usuario solo puede delegar permissions que él mismo posee.

La regla matemática:

```text
requestedPermissions ⊆ actorEffectivePermissions
```

Es decir:

```text
permissions solicitados para el nuevo role
deben ser un subconjunto
de los permissions efectivos del usuario autenticado
```

---

# 11. Ejemplo con Viewer

Supongamos que el usuario autenticado tiene:

```text
customers.read
tickets.read
campaigns.read
imports.read
reports.read
notifications.read
```

Ese usuario podría crear conceptualmente un custom role con:

```text
customers.read
tickets.read
notifications.read
```

Pero no podría asignar:

```text
customers.update
users.create
roles.manage
```

porque esos permissions no existen dentro de sus capacidades efectivas.

---

# 12. Ejemplo con Administrator

Supongamos que un administrator tiene:

```text
customers.read
customers.create
customers.update
customers.delete

tickets.read
tickets.create
tickets.update
tickets.assign

users.read
users.create
users.update_status

roles.read
```

Si crea:

```text
role = supervisor
```

podría asignar cualquier subconjunto de esos permissions.

Ejemplo válido:

```text
customers.read
customers.update
tickets.read
tickets.assign
users.read
```

Pero no:

```text
roles.manage
```

si el administrator no posee ese permission.

---

# 13. Protección contra privilege escalation

Esta regla evita escenarios peligrosos.

Sin política:

```text
administrator
↓
crea custom role
↓
agrega roles.manage
↓
se asigna ese role
↓
obtiene privilegios de superadmin
```

Con política:

```text
administrator
↓
no posee roles.manage
↓
intenta delegar roles.manage
↓
Auth Service rechaza
↓
403 Forbidden
```

---

# 14. Permission especial: roles.manage

Además de validar qué permissions puede delegar alguien, debería existir un permission explícito para administrar roles:

```text
roles.manage
```

Entonces la creación o modificación de roles requiere primero:

```text
¿actor tiene roles.manage?
```

Si no:

```text
403 Forbidden
```

---

# 15. Regla completa para crear un custom role

Flujo:

```text
POST /api/v1/roles
↓
JWT válido
↓
resolver usuario autenticado
↓
resolver permissions efectivos
↓
¿tiene roles.manage?
├── NO → 403
└── SÍ
     ↓
validar requestedPermissions
     ↓
requestedPermissions ⊆ actorEffectivePermissions ?
├── NO → 403
└── SÍ
     ↓
crear role
     ↓
crear role_permissions
```

---

# 16. Roles base vs roles custom

La política puede resumirse así:

```text
System Role
→ whitelist fija de permissions máximos permitidos

Custom Role
→ whitelist dinámica basada en permissions efectivos del actor
```

Esto permite mantener control sobre roles importantes del sistema y, al mismo tiempo, flexibilidad para roles personalizados.

---

# 17. Permissions efectivos de un usuario

Un usuario puede tener uno o varios roles.

Ejemplo:

```text
user 18
├── operator
└── report_manager
```

Los permissions efectivos son la unión de los permissions de todos sus roles activos.

Ejemplo:

```text
operator
├── customers.read
├── customers.update
└── reports.read

report_manager
├── reports.read
└── reports.create
```

Resultado:

```text
customers.read
customers.update
reports.read
reports.create
```

Sin duplicados.

---

# 18. Query conceptual de permissions efectivos

Ejemplo:

```sql
SELECT DISTINCT p.code
FROM user_roles ur
JOIN roles r
  ON r.id = ur.role_id
JOIN role_permissions rp
  ON rp.role_id = r.id
JOIN permissions p
  ON p.id = rp.permission_id
WHERE ur.user_id = $1
  AND ur.status = 'active'
  AND r.status = 'active';
```

El resultado es la lista real de capabilities del usuario.

---

# 19. Cache de permissions

Los permissions efectivos pueden cachearse:

```text
auth:permissions:user:{userId}
```

Ejemplo:

```text
auth:permissions:user:18
```

Flujo:

```text
request
↓
Redis
├── HIT → usar permissions
└── MISS
     ↓
   PostgreSQL
     ↓
   resolver permissions
     ↓
   Redis SET
```

---

# 20. Cambios de roles o permissions

Si se modifica:

```text
user_roles
```

o:

```text
role_permissions
```

debe invalidarse la cache afectada.

Ejemplo:

```text
admin modifica role operator
↓
role_permissions cambia
↓
usuarios con operator pueden tener cache stale
↓
invalidar permissions correspondientes
```

En sistemas más avanzados esto puede coordinarse mediante eventos:

```text
auth.permissions.changed
```

---

# 21. Autorización en API Gateway

El Gateway debe trabajar con permissions, no con nombres de roles.

Ejemplo:

```http
GET /api/v1/customers
```

requiere:

```text
customers.read
```

```http
POST /api/v1/customers
```

requiere:

```text
customers.create
```

```http
GET /api/v1/users
```

requiere:

```text
users.read
```

```http
POST /api/v1/users
```

requiere:

```text
users.create
```

```http
POST /api/v1/roles
```

requiere:

```text
roles.manage
```

---

# 22. 401 vs 403

Regla:

```text
401 Unauthorized
→ no está autenticado
→ JWT ausente
→ JWT inválido
→ JWT expirado
```

```text
403 Forbidden
→ sí sabemos quién es
→ pero no posee el permission requerido
```

Ejemplo:

```text
operator
↓
JWT válido
↓
POST /users
↓
users.create ausente
↓
403
```

---

# 23. Frontend

La UI puede recibir:

```json
{
  "user": {
    "id": 18,
    "roles": ["operator"],
    "permissions": [
      "customers.read",
      "customers.create",
      "customers.update",
      "tickets.read"
    ]
  }
}
```

Pero debería usar principalmente permissions para decidir qué mostrar.

Ejemplo:

```ts
if (permissions.includes('customers.read')) {
  showCustomersModule();
}
```

```ts
if (permissions.includes('customers.create')) {
  showCreateCustomerButton();
}
```

---

# 24. Evitar lógica por nombres de roles en frontend

Evitar:

```ts
if (
  role === 'administrator' ||
  role === 'superadmin' ||
  role === 'supervisor'
) {
  showUsers();
}
```

Porque los custom roles romperían ese modelo.

Mejor:

```ts
if (permissions.includes('users.read')) {
  showUsers();
}
```

---

# 25. Role en UI

El role sigue siendo útil para:

```text
mostrar perfil funcional
etiquetas
administración
asignación de usuarios
defaults
filtros
auditoría
```

Ejemplo:

```text
Nataniel
Role: Operator
```

Pero la autorización técnica sigue dependiendo de permissions.

---

# 26. Flujo completo de creación de un role custom

Ejemplo:

```text
Usuario autenticado
↓
JWT
↓
Gateway valida autenticación
↓
roles.manage
↓
Auth Service
↓
resolver actorEffectivePermissions
↓
request:
{
  name: "supervisor",
  permissions: [...]
}
↓
validar permissions solicitados
↓
requested ⊆ actorEffectivePermissions
↓
BEGIN
  INSERT roles
  INSERT role_permissions
COMMIT
↓
Role creado
```

---

# 27. Actualización de un custom role

Misma política.

Ejemplo:

```text
PATCH /roles/:id/permissions
↓
roles.manage
↓
resolver actor permissions
↓
validar permissions nuevos
↓
ningún permission puede superar al actor
↓
actualizar role_permissions
```

---

# 28. No confiar en datos enviados por UI

Nunca aceptar ciegamente:

```json
{
  "role": "superadmin",
  "permissions": [
    "roles.manage"
  ]
}
```

El backend siempre calcula qué permissions puede delegar el actor.

---

# 29. Regla importante sobre superadmin

`superadmin` puede tener:

```text
todos los permissions
```

Por tanto puede crear custom roles con cualquier subconjunto del catálogo.

Pero incluso en ese caso:

```text
Permission catalog
→ sigue siendo fijo
```

Superadmin puede asignar permissions existentes.

No debería inventar permissions que el código no conoce.

---

# 30. Matriz mental final

```text
PERMISSIONS
→ catálogo fijo
→ capabilities del sistema

ROLES
→ agrupadores de permissions

ROLE_PERMISSIONS
→ permissions actuales del role

USER_ROLES
→ roles asignados al usuario

EFFECTIVE PERMISSIONS
→ unión de permissions de roles activos
```

---

# 31. Política final de autorización

```text
Request
↓
JWT válido
↓
resolver identity
↓
resolver effective permissions
↓
endpoint required permission
↓
¿usuario lo tiene?
├── sí → continuar
└── no → 403
```

---

# 32. Política final de administración de roles

```text
Crear/editar role
↓
¿actor tiene roles.manage?
├── NO → 403
└── SÍ
     ↓
obtener permissions efectivos del actor
     ↓
obtener permissions solicitados
     ↓
requestedPermissions ⊆ actorEffectivePermissions
├── NO → 403
└── SÍ
     ↓
guardar role_permissions
```

Para roles base:

```text
además:
requestedPermissions ⊆ ROLE_PERMISSION_POLICY[role]
```

---

# 33. Regla definitiva

La política completa se puede resumir en cuatro reglas:

```text
1. Permissions son capacidades fijas del sistema.

2. Roles agrupan permissions.

3. La API autoriza por permission, nunca únicamente por role.

4. Nadie puede delegar a otro role un permission que no está autorizado a delegar.
```

Y para custom roles:

```text
customRolePermissions
⊆
actorEffectivePermissions
```

Eso evita privilege escalation y permite crear roles dinámicos sin tener que modificar la lógica del Gateway cada vez que aparece un nuevo role.


# Sincronización de permisos entre Auth Service, RabbitMQ, API Gateway y Redis

Cuando un role cambia sus permissions, los usuarios autenticados que tengan ese role deben reflejar el cambio sin necesidad de volver a iniciar sesión.

El flujo propuesto es:

```text
Auth Service
↓
actualiza role_permissions
↓
crea outbox_event
↓
COMMIT
↓
Outbox Publisher
↓
RabbitMQ
↓
Gateway Consumer
↓
identifica usuarios afectados
↓
actualiza permissions en Redis
↓
ACK RabbitMQ
```

---

## 1. Actualización del role

Supongamos que se modifica:

```text
role = operator
```

y sus nuevos permissions quedan:

```text
customers.read
customers.create
customers.update
tickets.read
tickets.create
reports.read
notifications.read
```

El Auth Service actualiza primero PostgreSQL:

```text
roles
↓
role_permissions
```

PostgreSQL sigue siendo la fuente de verdad.

---

## 2. Transactional Outbox

La actualización del role y la creación del evento deben ocurrir dentro de la misma transacción.

```text
BEGIN

UPDATE / DELETE / INSERT role_permissions

INSERT outbox_events

COMMIT
```

Esto evita:

```text
role_permissions actualizado ✅
RabbitMQ publish ❌
```

El evento queda persistido y puede publicarse posteriormente.

---

## 3. Evento publicado

El Outbox Publisher obtiene el evento pendiente y publica en RabbitMQ algo como:

```text
auth.permissions.changed
```

Payload conceptual:

```json
{
  "role_id": 2,
  "role_name": "operator",
  "permissions": [
    "customers.read",
    "customers.create",
    "customers.update",
    "tickets.read",
    "tickets.create",
    "reports.read",
    "notifications.read"
  ]
}
```

El evento representa:

```text
"El conjunto de permissions de este role cambió"
```

---

## 4. RabbitMQ

RabbitMQ transporta el evento de manera durable.

```text
Auth Service
↓
auth.permissions.changed
↓
RabbitMQ
↓
Gateway Consumer
```

La ventaja frente a utilizar exclusivamente Redis Pub/Sub es que RabbitMQ permite:

```text
ACK
retry
DLQ
persistencia del mensaje
```

Si el Gateway está temporalmente caído, el mensaje puede procesarse posteriormente.

---

## 5. Gateway Consumer

El API Gateway tiene un consumer encargado de reaccionar a:

```text
auth.permissions.changed
```

Cuando recibe el evento:

```text
role_id = operator
↓
buscar usuarios autenticados asociados a ese role
↓
actualizar sus permissions efectivos en Redis
```

El Gateway no está tomando una decisión de negocio sobre el role.

Está sincronizando su capa de autorización/cache con el nuevo estado publicado por Auth Service.

---

## 6. Usuarios afectados

Supongamos:

```text
operator
```

está actualmente asociado a:

```text
user 18
user 25
user 40
```

y esos usuarios tienen sesiones activas.

El consumer debe actualizar:

```text
auth:permissions:user:18
auth:permissions:user:25
auth:permissions:user:40
```

---

## 7. Permissions efectivos

Existe un detalle importante:

Un usuario puede tener más de un role.

Ejemplo:

```text
user 18
├── operator
└── report_manager
```

Entonces sus permissions efectivos son:

```text
permissions(operator)
UNION
permissions(report_manager)
```

Por tanto, cuando cambia `operator`, no se debe simplemente reemplazar el cache del usuario con:

```text
permissions(operator)
```

porque se perderían los permissions provenientes de:

```text
report_manager
```

El resultado final en Redis debe representar siempre:

```text
EffectivePermissions(user)
=
UNION de permissions de todos sus roles activos
```

---

## 8. Actualización de Redis

Después de resolver los permissions efectivos:

```text
Gateway Consumer
↓
SET auth:permissions:user:{userId}
```

Ejemplo:

```text
SET auth:permissions:user:18
```

con:

```json
[
  "customers.read",
  "customers.create",
  "customers.update",
  "tickets.read",
  "tickets.create",
  "reports.read",
  "reports.create",
  "notifications.read"
]
```

Redis representa el estado de autorización utilizado por el Gateway.

PostgreSQL sigue siendo la fuente de verdad.

---

## 9. ACK del evento

El mensaje de RabbitMQ solo debe marcarse como procesado después de actualizar correctamente el estado correspondiente en Redis.

Flujo:

```text
RabbitMQ message
↓
resolver usuarios
↓
resolver effective permissions
↓
actualizar Redis
↓
todo correcto
↓
ACK
```

Si ocurre un error:

```text
Redis update ❌
```

entonces:

```text
NO ACK
↓
retry
↓
eventualmente DLQ
```

según la política de reintentos configurada.

La idea es evitar:

```text
RabbitMQ ACK ✅
Redis permissions desactualizados ❌
```

---

## 10. Resultado final

El flujo completo queda:

```text
ROLE UPDATE
↓
Auth Service
↓
PostgreSQL
↓
role_permissions
↓
outbox_events
↓
Outbox Publisher
↓
RabbitMQ
↓
auth.permissions.changed
↓
API Gateway Consumer
↓
buscar usuarios afectados
↓
recalcular effective permissions
↓
Redis SET por userId
↓
ACK
```

Después de esto, las siguientes requests utilizan inmediatamente los nuevos permissions.

---

## 11. Ejemplo práctico

Antes:

```text
operator
├── customers.read
├── customers.create
└── customers.update
```

Usuario:

```text
user 18
→ operator
```

Redis:

```text
auth:permissions:user:18
[
  customers.read,
  customers.create,
  customers.update
]
```

Ahora un administrador elimina:

```text
customers.update
```

del role `operator`.

Flujo:

```text
Auth Service
↓
DELETE role_permissions
↓
Outbox
↓
RabbitMQ
↓
Gateway
↓
user 18 afectado
↓
recalcular permissions
↓
Redis
```

Nuevo cache:

```text
auth:permissions:user:18
[
  customers.read,
  customers.create
]
```

Si el usuario intenta:

```http
PATCH /api/v1/customers/50
```

el Gateway valida:

```text
required permission:
customers.update
```

Resultado:

```text
customers.update ❌
↓
403 Forbidden
```

El usuario no necesitó:

```text
logout
login
refresh manual
```

El cambio de autorización se propagó mientras su sesión seguía activa.

---

# 12. Responsabilidades

```text
Auth Service
→ modifica roles y permissions
→ source of truth de autorización
→ publica cambios

Outbox
→ garantiza persistencia del evento

RabbitMQ
→ transporte durable del cambio

API Gateway Consumer
→ recibe cambios de autorización
→ identifica usuarios afectados
→ sincroniza cache

Redis
→ almacena permissions efectivos por usuario

Gateway Middleware
→ utiliza esos permissions para autorizar requests
```

---

# 13. Regla arquitectónica

```text
PostgreSQL
→ verdad

RabbitMQ
→ propagación durable

Redis
→ estado derivado/cache

API Gateway
→ enforcement
```

Nunca debe ocurrir que Redis se convierta en la fuente principal de verdad sobre los permissions.

Redis contiene una representación derivada del estado administrado por Auth Service.

---

# 14. Beneficio

Este diseño permite:

```text
cambios de permisos casi inmediatos
sin logout
sin login nuevamente
sin depender exclusivamente de JWT viejo
sin acoplar Gateway directamente a Auth Service por cada request
```

Y mantiene separación de responsabilidades:

```text
Auth Service
→ decide qué permissions existen y quién los tiene

Gateway
→ aplica esos permissions

RabbitMQ
→ comunica cambios

Redis
→ acelera la autorización
```