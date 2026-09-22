# Modelo de Roles, Permisos y Delegación — Auth Service

## Objetivo

El objetivo de este modelo es permitir que el sistema sea flexible para administrar roles y permisos, pero evitando escalamiento de privilegios.

La idea principal es separar claramente:

1. **Roles system vs roles custom**
2. **Permisos delegables vs no delegables**
3. **Actualización normal de permisos vs asignación de roles privilegiados**

---

# 1. Conceptos principales

## `role.is_system`

`is_system` pertenece al **role**.

Sirve para indicar que ese role fue definido por el sistema y debe estar protegido.

Ejemplos:

```text
viewer
operator
admin
superadmin
```

Estos roles podrían tener:

```text
is_system = true
```

Eso significa que normalmente:

- no se eliminan;
- no se renombran libremente;
- no se modifica su estructura desde un CRUD normal;
- representan roles base de StreamCRM.

Importante:

```text
role.is_system
NO significa
"los permisos de este role no pueden delegarse"
```

Un permiso puede existir dentro de un role system y aun así ser delegable.

---

## `permission.is_delegable`

`is_delegable` pertenece al **permiso**.

Sirve para decidir si ese permiso puede asignarse manualmente a otros usuarios o incluirse dentro de roles custom.

Ejemplo:

```text
customers.read          is_delegable = true
customers.update        is_delegable = true
reports.read            is_delegable = true
reports.generate        is_delegable = true

roles.manage            is_delegable = false
permissions.manage      is_delegable = false
users.assign_roles      is_delegable = false
```

La idea es:

```text
Permisos normales del negocio
→ normalmente delegables

Permisos administrativos sensibles
→ normalmente NO delegables
```

Por lo tanto:

```text
tener un permiso
≠
poder delegarlo
```

---

# 2. Cómo obtiene permisos un usuario

Un usuario puede tener uno o varios roles.

Ejemplo:

```text
Usuario Juan

Roles:
├── viewer
└── operator
```

Los permisos efectivos del usuario son la unión de los permisos de todos sus roles:

```text
viewer
├── reports.read
└── customers.read

operator
├── customers.update
├── tickets.read
└── tickets.update
```

Resultado:

```text
Juan

reports.read
customers.read
customers.update
tickets.read
tickets.update
```

Por tanto:

```text
effectivePermissions(user)
=
UNION(permisos de todos sus roles)
```

---

# 3. Crear un usuario normal

Cuando se crea un usuario normal:

```text
crear usuario
↓
validar datos
↓
crear registro
↓
asignar role viewer
↓
usuario listo
```

Ejemplo:

```text
viewer
is_system = true

permissions:
├── reports.read
├── customers.read
└── tickets.read
```

El usuario obtiene automáticamente esos permisos.

No importa si el role es `system`.

---

# 4. Actualización normal de permisos

Este flujo sirve para administrar permisos delegables.

Supongamos que el actor es un `admin`.

Tiene estos permisos efectivos:

```text
customers.read
customers.update
reports.read
reports.generate
roles.manage
permissions.manage
```

Pero los permisos están definidos así:

```text
customers.read          delegable = true
customers.update        delegable = true
reports.read            delegable = true
reports.generate        delegable = true

roles.manage            delegable = false
permissions.manage      delegable = false
```

El actor posee todos esos permisos, pero solamente puede delegar los que tengan:

```text
is_delegable = true
```

---

# 5. Reglas para actualizar permisos

Para permitir una actualización, cada permiso enviado debe cumplir:

```text
1. El permiso existe.
2. El actor posee ese permiso.
3. El permiso tiene is_delegable = true.
```

Formalmente:

```text
requestedPermissions ⊆ actorEffectivePermissions
```

y además:

```text
∀ requestedPermission:
    permission.is_delegable = true
```

Ejemplo:

```text
Actor:

customers.read
customers.update
reports.read
reports.generate
roles.manage
permissions.manage
```

Request:

```text
customers.read
reports.generate
```

Resultado:

```text
customers.read      ✅ actor lo tiene + delegable
reports.generate    ✅ actor lo tiene + delegable
```

Pero:

```text
permissions.manage
```

sería rechazado porque:

```text
actor lo tiene          ✅
permiso existe          ✅
is_delegable = false    ❌
```

---

# 6. El permiso puede venir de un role system

Esto es importante.

Supongamos:

```text
operator
is_system = true

permissions:
├── customers.read
├── customers.update
├── reports.read
└── reports.generate
```

Y:

```text
customers.update
is_delegable = true
```

Un admin puede utilizar `customers.update` dentro de un role custom aunque originalmente ese permiso también esté dentro de `operator`.

Ejemplo:

```text
customer_manager
is_system = false

permissions:
├── customers.read
└── customers.update
```

Eso es válido.

La validación NO debe preguntar:

```text
¿el permiso viene de un role system?
```

Debe preguntar:

```text
¿el permiso existe?
¿el actor lo posee?
¿el permiso es delegable?
```

---

# 7. Roles custom

Los roles custom pueden construirse utilizando permisos delegables.

Ejemplo:

```text
report_manager
is_system = false

permissions:
├── reports.read
├── reports.generate
└── customers.read
```

El hecho de que esos permisos también aparezcan dentro de roles system no importa.

La regla sigue siendo:

```text
permission.is_delegable = true
```

---

# 8. Evitar escalamiento de privilegios

Los permisos administrativos sensibles deben marcarse como:

```text
is_delegable = false
```

Por ejemplo:

```text
roles.manage
permissions.manage
users.assign_roles
users.manage_permissions
system.config
```

Entonces un admin puede tenerlos y utilizarlos, pero no puede hacer esto:

```text
crear custom_role
↓
agregar permissions.manage
↓
asignarlo a un operator
```

Porque:

```text
permissions.manage.is_delegable = false
```

De esta forma:

```text
tener un permiso sensible
≠
poder propagar ese permiso
```

---

# 9. Crear un admin o superadmin

Aquí NO se utiliza el flujo normal de delegación de permisos.

No hacemos:

```text
crear usuario
↓
darle manualmente:
roles.manage
permissions.manage
users.assign_roles
...
```

En lugar de eso:

```text
crear usuario
↓
asignar role system = admin
```

El role `admin` ya contiene sus permisos.

Ejemplo:

```text
admin
is_system = true

permissions:
├── customers.read
├── customers.update
├── reports.generate
├── roles.manage
└── permissions.manage
```

El usuario obtiene TODOS esos permisos automáticamente.

Aunque:

```text
roles.manage            is_delegable = false
permissions.manage      is_delegable = false
```

eso no representa ningún problema.

`is_delegable = false` NO significa:

```text
"el usuario no puede tener este permiso"
```

Significa:

```text
"este permiso no puede asignarse manualmente
mediante el flujo normal de delegación"
```

---

# 10. Promover un usuario

Ejemplo inicial:

```text
Juan

roles:
└── viewer
```

Para convertirlo en operador:

```text
assign role operator
```

Puede quedar:

```text
Juan

roles:
├── viewer
└── operator
```

Sus permisos efectivos son la unión de ambos.

Para convertirlo en admin:

```text
assign role admin
```

Ahora:

```text
Juan

roles:
├── viewer
├── operator
└── admin
```

Y automáticamente obtiene los permisos definidos por `admin`, incluidos los no delegables.

---

# 11. ¿Cómo quitar privilegios de admin?

No se deberían eliminar manualmente permisos como:

```text
roles.manage
permissions.manage
```

Si esos permisos pertenecen al role `admin`.

En lugar de:

```text
quitar roles.manage
quitar permissions.manage
```

se hace:

```text
remove role admin
```

Entonces desaparecen los permisos que el usuario obtenía exclusivamente de ese role.

Esto mantiene RBAC coherente.

---

# 12. Actualizar permisos de un admin

Un admin puede tener:

```text
customers.read          delegable = true
reports.generate        delegable = true
roles.manage            delegable = false
permissions.manage      delegable = false
```

Si ejecutamos una actualización normal de permisos, solamente deberían administrarse los permisos delegables.

Ejemplo:

```text
Request:

customers.read
tickets.read
```

Resultado conceptual:

```text
customers.read          KEEP
reports.generate        REMOVE
tickets.read            ADD

roles.manage            UNTOUCHED
permissions.manage      UNTOUCHED
```

Los permisos no delegables quedan fuera del flujo normal.

Mientras el usuario tenga el role `admin`, esos permisos continúan existiendo.

---

# 13. Diff de permisos

No conviene hacer:

```text
DELETE todos
INSERT todos
```

Es mejor calcular diferencias.

Ejemplo:

```text
current:
[A, B, C]

requested:
[B, C, D]
```

Resultado:

```text
toAdd:
[D]

toRemove:
[A]

toKeep:
[B, C]
```

Pero el diff debe realizarse solamente sobre permisos administrables/delegables.

Los permisos protegidos:

```text
is_delegable = false
```

no deben entrar al diff normal.

---

# 14. Flujo completo de actualización

```text
REQUEST UPDATE PERMISSIONS
        ↓
1. Obtener actor desde JWT/contexto
        ↓
2. Buscar actor
        ↓
3. Validar:
   - existe
   - está activo
        ↓
4. Buscar target
        ↓
5. Validar:
   - existe
   - está activo
        ↓
6. Validar que el actor tiene capacidad
   para administrar permisos/roles
        ↓
7. Obtener permisos efectivos del actor
        ↓
8. Obtener permisos enviados
        ↓
9. Validar que todos los permisos existen
        ↓
10. Validar:

    requestedPermissions
          ⊆
    actorEffectivePermissions
        ↓
11. Validar por cada permiso:

    is_delegable = true
        ↓
12. Obtener permisos delegables actuales
        ↓
13. Calcular:

    toAdd
    toRemove
    toKeep
        ↓
14. Aplicar cambios dentro de transaction/UoW
        ↓
15. Commit
        ↓
16. Responder permisos actualizados
```

---

# 15. Flujo completo para asignar admin

Este flujo es distinto.

```text
REQUEST ASSIGN ROLE
        ↓
1. Autenticar actor
        ↓
2. Validar actor activo
        ↓
3. Validar target activo
        ↓
4. Validar que actor puede asignar roles privilegiados
        ↓
5. Validar role destino
        ↓
6. Si role = admin:
      validar política correspondiente
        ↓
7. Si role = superadmin:
      exigir actor superadmin
        ↓
8. Insertar user_role
        ↓
9. Commit
```

El usuario obtiene automáticamente todos los permisos del role asignado.

No se copian permisos individualmente al usuario.

---

# 16. Jerarquía sugerida

Una política razonable:

```text
superadmin
→ puede asignar admin
→ puede asignar superadmin
→ puede administrar roles normales

admin
→ puede administrar roles custom
→ puede asignar viewer/operator
→ puede asignar permisos delegables
→ NO puede asignar superadmin

operator
→ utiliza capacidades operativas
→ NO delega permisos

viewer
→ acceso limitado
→ NO delega permisos
```

Si más adelante se quiere permitir que un admin cree otro admin, eso puede definirse como una regla explícita.

---

# 17. Responsabilidad de cada concepto

## Role system

```text
role.is_system
```

Responde:

> ¿Este role forma parte de los roles protegidos/base del sistema?

Ejemplo:

```text
viewer
operator
admin
superadmin
```

## Role custom

```text
role.is_system = false
```

Responde:

> ¿Este role fue creado para necesidades específicas del negocio?

Ejemplo:

```text
report_viewer
customer_manager
campaign_manager
support_agent
```

## Permiso delegable

```text
permission.is_delegable = true
```

Responde:

> ¿Puede este permiso asignarse mediante administración normal?

## Permiso no delegable

```text
permission.is_delegable = false
```

Responde:

> ¿Este permiso está reservado para flujos privilegiados/system roles?

---

# 18. Regla mental definitiva

Para un permiso normal:

```text
¿existe?
↓
¿actor lo posee?
↓
¿is_delegable = true?
↓
sí
↓
puede delegarlo
```

Para permisos sensibles:

```text
is_delegable = false
↓
NO se asignan mediante updatePermissions
↓
se obtienen mediante roles system privilegiados
```

Para promover a admin:

```text
NO agregar permisos administrativos manualmente
↓
asignar role admin
```

Para remover admin:

```text
NO quitar permisos uno por uno
↓
remover role admin
```

---

# 19. Resumen final

```text
USUARIO
↓
tiene uno o varios ROLES
↓
los ROLES contienen PERMISOS
↓
los permisos efectivos son la unión de todos los roles
```

Los roles:

```text
SYSTEM
→ protegidos
→ viewer
→ operator
→ admin
→ superadmin

CUSTOM
→ creados por administradores
→ report_viewer
→ customer_manager
→ etc.
```

Los permisos:

```text
DELEGABLE = true
→ pueden utilizarse en administración normal
→ pueden incluirse en roles custom

DELEGABLE = false
→ permisos sensibles
→ no pueden propagarse manualmente
→ normalmente llegan mediante roles system privilegiados
```

Y la separación fundamental es:

```text
role.is_system
→ protege el ROLE

permission.is_delegable
→ protege la DELEGACIÓN
```

Con este modelo obtenemos flexibilidad para reutilizar permisos operativos entre roles system y custom, mientras mantenemos protegidos los permisos administrativos que podrían provocar escalamiento de privilegios.


---

# 20. Política definitiva: administración de RBAC exclusiva del Superadmin

Para simplificar el modelo y reducir el riesgo de escalamiento de privilegios, toda la administración de **roles y permisos** queda reservada exclusivamente al `superadmin`.

## Superadmin

El `superadmin` puede:

```text
✅ crear roles custom
✅ actualizar roles custom
✅ eliminar roles custom
✅ asignar roles a usuarios
✅ remover roles de usuarios
✅ decidir qué permisos contiene cada role custom
✅ consultar roles y permisos
```

Para crear o actualizar un role custom:

```text
actor = superadmin
↓
actor existe y está activo
↓
actor posee role.manage
↓
validar que el role target sea administrable
↓
validar que todos los permisos solicitados existan
↓
validar que los permisos solicitados estén dentro
de los permisos efectivos del superadmin
↓
rechazar permisos reservados de administración RBAC
↓
crear/actualizar role
↓
asociar permisos
```

La regla general sigue siendo:

```text
requestedPermissions ⊆ superadminEffectivePermissions
```

Pero hay permisos reservados que NO pueden asignarse a roles custom aunque el superadmin los posea.

Por ejemplo:

```text
role.manage
permission.manage
roles.assign
```

Estos permisos permiten administrar el propio sistema RBAC y deben permanecer reservados al role `superadmin`.

Por tanto:

```text
superadmin posee role.manage
→ puede usarlo

pero

superadmin NO puede meter role.manage
dentro de un role custom
```

Esto evita crear indirectamente otro role con capacidad de administrar roles y permisos.

## Admin

El `admin` NO administra RBAC.

Puede realizar operaciones administrativas sobre usuarios, por ejemplo:

```text
✅ consultar usuarios
✅ actualizar información permitida del usuario
✅ bloquear/desbloquear usuarios
```

Pero:

```text
❌ no crea roles
❌ no actualiza roles
❌ no elimina roles
❌ no asigna permisos
❌ no modifica permisos de otros usuarios
❌ no administra role_permissions
```

## Operator y Viewer

Tampoco administran roles ni permisos.

```text
operator
→ usa las capacidades que sus roles le otorguen

viewer
→ acceso limitado según sus roles
```

## Regla mental simplificada

```text
SUPERADMIN
→ administra usuarios privilegiados
→ administra roles
→ administra permisos de los roles
→ asigna/remueve roles

ADMIN
→ administra información/estado de usuarios
→ NO administra seguridad RBAC

OPERATOR / VIEWER
→ consumen permisos
→ NO administran seguridad RBAC
```

## Permisos reservados

Los permisos capaces de modificar el propio sistema de autorización no deben poder agregarse a roles custom.

Ejemplo:

```text
role.manage
permission.manage
roles.assign
```

Aunque el `superadmin` los posea:

```text
is_delegable = false
```

Mientras que permisos funcionales del dominio pueden ser delegables:

```text
customers.read
customers.update
tickets.read
tickets.update
reports.read
reports.generate

is_delegable = true
```

De esta manera un `superadmin` puede crear un role custom muy poderoso con todos los permisos funcionales necesarios, pero no puede convertirlo en un nuevo administrador del sistema RBAC.
