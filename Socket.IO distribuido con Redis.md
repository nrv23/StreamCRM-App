# Socket.IO distribuido con Redis

## Objetivo

El objetivo es permitir que las notificaciones realtime funcionen correctamente cuando `notification-service` tenga **más de una instancia**.

Actualmente, con una sola instancia, el flujo es:

```text
RabbitMQ
↓
Notification Worker
↓
PostgreSQL
↓
IPC / postMessage
↓
Main Thread
↓
SocketConsumer
↓
SocketServer
↓
room user:{id}
↓
cliente
```

Esto funciona porque todos los sockets conectados viven dentro de una sola instancia de `notification-service`.

El problema aparece cuando escalamos horizontalmente.

---

# 1. El problema de múltiples instancias

Supongamos que levantamos dos instancias:

```text
Notification Service #1
Notification Service #2
```

Cada una tiene:

```text
su propio proceso
su propio heap
sus propias variables
su propio SocketServer
sus propias conexiones
sus propias rooms
```

Por ejemplo:

```text
Notification Service #1

rooms:
user:25
user:30
```

mientras que:

```text
Notification Service #2

rooms:
user:18
user:40
```

Si `user:18` está conectado a la instancia #2:

```text
Notification Service #2
↓
room user:18
↓
socketABC
```

pero el evento que debe notificarse es procesado por la instancia #1:

```text
RabbitMQ
↓
Notification Service #1
↓
emitToRoom("user:18")
```

la instancia #1 busca `user:18` solamente en su memoria.

Resultado:

```text
Notification Service #1

user:18 → no existe
```

aunque realmente el usuario sí está conectado:

```text
Notification Service #2

user:18
└── socketABC
```

Por lo tanto:

```text
evento procesado correctamente
↓
Socket.IO Instance #1 intenta emitir
↓
usuario está conectado a Instance #2
↓
mensaje no llega
```

Este es el problema fundamental que debemos resolver.

---

# 2. La causa: memoria aislada

Cada proceso de Node.js tiene su propia memoria.

Por ejemplo:

```text
Instance #1 memory
├── SocketServer
├── rooms
├── sockets
└── variables

Instance #2 memory
├── SocketServer
├── rooms
├── sockets
└── variables
```

No existe automáticamente:

```text
memoria global compartida
```

entre las dos instancias.

Esto es exactamente el mismo concepto que apareció anteriormente entre:

```text
Worker Thread
↓
IPC
↓
Main Thread
```

El worker no podía acceder directamente a la instancia de `SocketServer` que vivía en el main thread.

La solución fue:

```text
Worker
↓
postMessage
↓
Main Thread
↓
SocketServer
```

Ahora tenemos el mismo problema, pero a otro nivel:

```text
Instance #1
↓
???
↓
Instance #2
```

Aquí necesitamos un mecanismo de comunicación por red.

Redis puede cumplir esa función.

---

# 3. Qué papel cumple Redis

Redis se utiliza como mecanismo de propagación realtime entre las diferentes instancias de Socket.IO.

Conceptualmente:

```text
Notification Service #1
↓
Redis
↓
Notification Service #2
```

Si una instancia genera un evento para:

```text
user:18
```

las demás instancias pueden enterarse de ese evento.

La instancia que realmente tenga al usuario conectado podrá ejecutar:

```text
emitToRoom("user:18")
```

sobre sus sockets locales.

---

# 4. Redis NO reemplaza RabbitMQ

Es fundamental separar responsabilidades.

RabbitMQ y Redis no resuelven el mismo problema.

## RabbitMQ

RabbitMQ maneja eventos de negocio durables.

Ejemplos:

```text
customer.created
customer.updated
customer.deleted
customer.tag.added
campaign.completed
```

RabbitMQ ofrece mecanismos como:

```text
ACK
NACK
retry
DLQ
durabilidad
consumer acknowledgement
```

Por ejemplo:

```text
Customer Service
↓
RabbitMQ
↓
Notification Service
```

Si un consumer falla, RabbitMQ puede volver a entregar el mensaje.

---

## Redis Pub/Sub

Redis Pub/Sub está pensado para propagación rápida de mensajes entre procesos conectados.

Ejemplo:

```text
Notification #1
↓
Redis
↓
Notification #2
```

Redis Pub/Sub es:

```text
rápido
simple
efímero
```

pero no es una cola durable.

Si un subscriber está desconectado cuando ocurre:

```text
PUBLISH
```

no recibe el mensaje después.

No existe:

```text
replay automático
ACK
retry durable
DLQ
```

Por eso:

```text
RabbitMQ
→ integración durable

Redis
→ realtime distribuido
```

---

# 5. PostgreSQL sigue siendo la fuente de verdad

En StreamCRM las notificaciones `in_app` se guardan antes de intentar enviarlas realtime.

El flujo es:

```text
notification
↓
notification_delivery
↓
processing
↓
delivered
↓
COMMIT
↓
Socket.IO
```

Por lo tanto:

```text
PostgreSQL
→ fuente de verdad

Socket.IO
→ entrega realtime best-effort

Redis
→ propagación entre instancias
```

Si Redis falla:

```text
realtime puede fallar
```

pero la notificación sigue persistida.

El frontend puede recuperarla mediante:

```http
GET /api/v1/notifications
```

Esto es importante porque Redis Pub/Sub no necesita convertirse en un sistema durable.

La durabilidad ya existe en PostgreSQL.

---

# 6. Arquitectura final esperada

Conceptualmente:

```text
                    RabbitMQ
                       ↓
              Notification Service
                       ↓
                  PostgreSQL
                       ↓
                realtime event
                       ↓

             ┌──────── Redis ────────┐
             │                       │
             ↓                       ↓

Notification Service #1     Notification Service #2
       ↓                            ↓
   Socket.IO                     Socket.IO
       ↓                            ↓
 local rooms                   local rooms
       ↓                            ↓
   clients                        clients
```

Cada instancia mantiene únicamente los sockets que están físicamente conectados a ella.

Redis permite propagar los eventos entre todas las instancias.

---

# 7. Estrategia de implementación

La implementación se puede estudiar en tres fases.

```text
FASE 1
Dos instancias sin Redis
↓
demostrar el problema
```

```text
FASE 2
Redis Pub/Sub manual
↓
entender cómo funciona
```

```text
FASE 3
Socket.IO Redis Adapter
↓
solución más integrada
```

---

# 8. Fase 1 — Dos instancias sin Redis

Primero debemos demostrar el fallo.

Por ejemplo:

```text
Notification Service #1
localhost:3001

Notification Service #2
localhost:3002
```

Conectamos Postman a:

```text
localhost:3002/notifications
```

y lo agregamos a:

```text
user:18
```

Entonces:

```text
Instance #2

room user:18
└── Postman
```

Ahora hacemos que el evento sea procesado por Instance #1.

```text
RabbitMQ
↓
Instance #1
↓
SocketServer.emitToRoom("user:18")
```

Instance #1 solamente conoce sus propias rooms:

```text
Instance #1

user:18 → vacío
```

Resultado esperado:

```text
Postman NO recibe el mensaje
```

Esto demuestra físicamente el problema.

---

# 9. Modelo mental del problema

Sin Redis:

```text
Instance #1
rooms:
user:20
user:25


Instance #2
rooms:
user:18
user:30
```

Si #1 ejecuta:

```ts
io.to("user:18").emit(...)
```

solo busca dentro de:

```text
Instance #1
```

No consulta:

```text
Instance #2
```

porque ambas instancias tienen memoria independiente.

---

# 10. Opción 1 — Redis Pub/Sub manual

La primera implementación puede hacerse manualmente para entender qué ocurre debajo.

Tendremos:

```text
Redis Publisher
Redis Subscriber
```

Cada instancia de `notification-service` tendrá un subscriber.

Cuando una instancia necesite enviar un mensaje realtime:

```text
Notification Service #1
↓
Redis PUBLISH
```

Redis distribuye el mensaje:

```text
Redis
├── Notification #1 subscriber
└── Notification #2 subscriber
```

Cada instancia recibe el evento.

Después cada instancia ejecuta:

```text
emitToRoom(...)
```

sobre sus sockets locales.

---

# 11. Flujo con Redis Pub/Sub manual

Ejemplo:

```text
RabbitMQ
↓
Notification Service #1
↓
delivery in_app
↓
SocketPublisher
↓
Redis PUBLISH
```

Redis:

```text
channel: socket-events
```

Payload:

```json
{
  "room": "user:18",
  "event": "customer.tag.added",
  "payload": {
    "message": "Tag was created",
    "data": {
      "tag_id": 24,
      "tag_name": "test 15"
    }
  }
}
```

Redis distribuye:

```text
socket-events
     │
     ├────→ Instance #1
     │
     └────→ Instance #2
```

Cada instancia hace:

```ts
socketServer.emitToRoom(
    message.room,
    message.event,
    message.payload
);
```

Instance #1:

```text
user:18 → no existe
```

No ocurre nada.

Instance #2:

```text
user:18
└── socketABC
```

Entonces:

```text
socketABC recibe el evento
```

---

# 12. Arquitectura Redis Pub/Sub manual

```text
                    RabbitMQ
                       ↓
               Notification #1
                       ↓
                SocketPublisher
                       ↓
                Redis PUBLISH
                       ↓
                 socket-events
                  /          \
                 /            \
                ↓              ↓
        Redis Subscriber  Redis Subscriber
               #1              #2
                ↓               ↓
          SocketServer     SocketServer
                ↓               ↓
          local rooms       local rooms
```

---

# 13. Redis Publisher

Conceptualmente podríamos tener:

```ts
interface IRealtimePublisher {
    publish(message: SocketMessage): Promise<void>;
}
```

Implementación:

```text
RedisSocketPublisher
```

Su responsabilidad:

```text
recibir evento realtime
↓
serializar
↓
Redis PUBLISH
```

No debería conocer:

```text
rooms locales
sockets
Socket.IO
```

---

# 14. Redis Subscriber

Cada instancia tendría un componente:

```text
RedisSocketConsumer
```

Su responsabilidad:

```text
SUBSCRIBE socket-events
↓
recibir mensaje
↓
parsear
↓
SocketServer.emitToRoom(...)
```

Flujo:

```text
RedisSocketConsumer
↓
SocketServer
↓
room
↓
sockets locales
```

---

# 15. Dos conexiones Redis

Normalmente se utilizan dos conexiones separadas:

```text
Redis Publisher Client
Redis Subscriber Client
```

Conceptualmente:

```ts
const publisher = createClient();
const subscriber = publisher.duplicate();
```

Esto evita mezclar una conexión dedicada a:

```text
SUBSCRIBE
```

con operaciones normales como:

```text
PUBLISH
GET
SET
```

---

# 16. Ventajas de Redis Pub/Sub manual

La gran ventaja para aprendizaje es que podemos ver exactamente el mecanismo.

```text
App
↓
Redis PUBLISH
↓
Redis channel
↓
SUBSCRIBE
↓
SocketServer
```

Esto permite entender claramente:

```text
por qué Redis existe
qué problema resuelve
qué información viaja
qué instancia recibe el mensaje
```

También permite instrumentarlo fácilmente.

Ejemplo:

```text
[REDIS PUBLISH]
room=user:18

[REDIS SUBSCRIBE INSTANCE-1]
room=user:18

[REDIS SUBSCRIBE INSTANCE-2]
room=user:18
```

---

# 17. Desventajas del Pub/Sub manual

La aplicación debe manejar manualmente:

```text
serialización
deserialización
channels
publish
subscribe
routing
errores
reconexión
event types
```

Además estamos reconstruyendo parcialmente un problema que Socket.IO ya sabe resolver.

Por eso existe otra opción.

---

# 18. Opción 2 — Socket.IO Redis Adapter

Socket.IO tiene un Adapter para Redis.

El Adapter sustituye el adapter local de Socket.IO.

Por defecto Socket.IO utiliza un adapter en memoria.

Conceptualmente:

```text
Socket.IO
↓
Memory Adapter
↓
local rooms
```

Esto funciona con una sola instancia.

Cuando agregamos Redis Adapter:

```text
Socket.IO
↓
Redis Adapter
↓
Redis Pub/Sub
↓
otros Socket.IO servers
```

El código de negocio puede seguir haciendo:

```ts
io.to("user:18").emit(
    "customer.tag.added",
    payload
);
```

La diferencia está debajo.

---

# 19. Cómo funciona conceptualmente el Redis Adapter

Supongamos:

```text
Instance #1
Instance #2
```

Postman está conectado a #2:

```text
Instance #2
↓
user:18
↓
socketABC
```

Instance #1 ejecuta:

```ts
io.to("user:18").emit(
    "customer.tag.added",
    payload
);
```

El Adapter hace aproximadamente:

```text
Instance #1
↓
Redis Adapter
↓
Redis Pub/Sub
↓
Instance #2 Redis Adapter
↓
local Socket.IO
↓
room user:18
↓
socketABC
```

El código del emit no necesita saber en qué instancia vive el usuario.

---

# 20. Arquitectura con Redis Adapter

```text
                         Redis
                    /             \
                   /               \
                  ↓                 ↓

        Socket.IO Instance #1   Socket.IO Instance #2
                │                       │
          Redis Adapter           Redis Adapter
                │                       │
          local sockets             local sockets
```

Desde la aplicación:

```ts
io.to(room).emit(event, payload);
```

El Adapter se encarga de propagar el evento a las demás instancias.

---

# 21. Diferencia entre las dos opciones

## Pub/Sub manual

La aplicación hace:

```text
SocketPublisher
↓
Redis PUBLISH
↓
RedisSocketConsumer
↓
SocketServer.emitToRoom
```

Tenemos control explícito sobre todo el mecanismo.

---

## Redis Adapter

La aplicación hace:

```text
SocketServer.emitToRoom
```

y por debajo:

```text
Socket.IO
↓
Redis Adapter
↓
Redis
↓
otros Socket.IO servers
```

La propagación queda integrada en Socket.IO.

---

# 22. Comparación

| Característica | Pub/Sub manual | Redis Adapter |
|---|---|---|
| Aprendizaje | Excelente | Más abstracto |
| Control | Muy alto | Menor |
| Código propio | Más | Menos |
| Integración Socket.IO | Manual | Nativa |
| Routing de rooms | Manual/local | Automático |
| Complejidad | Mayor | Menor |
| Producción | Viable | Generalmente más cómodo |
| Entender qué pasa debajo | Excelente | Menos visible |

---

# 23. Estrategia recomendada para StreamCRM

La mejor estrategia para aprender sería:

```text
1. Levantar dos instancias sin Redis
```

Demostrar:

```text
usuario conectado a #2
evento emitido desde #1
↓
mensaje perdido realtime
```

Después:

```text
2. Implementar Redis Pub/Sub manual
```

para entender:

```text
PUBLISH
SUBSCRIBE
propagación entre procesos
```

Finalmente:

```text
3. Implementar Redis Adapter
```

y comparar ambas soluciones.

Esto permite entender no solamente:

```text
cómo configurar Redis
```

sino:

```text
por qué Redis es necesario
```

---

# 24. Relación con IPC

Existe una similitud muy importante con el problema resuelto anteriormente.

## Worker → Main Thread

```text
Worker Thread
↓
postMessage
↓
Main Thread
```

La frontera era:

```text
memoria de worker
≠
memoria del main
```

La solución fue:

```text
IPC
```

---

## Instance → Instance

Ahora la frontera es:

```text
memory Instance #1
≠
memory Instance #2
```

La solución será:

```text
Redis / network communication
```

Entonces:

```text
Worker ↔ Main
→ IPC

Instance ↔ Instance
→ Redis
```

El problema fundamental es el mismo:

> una frontera de memoria necesita un mecanismo de comunicación.

---

# 25. RabbitMQ vs Redis vs PostgreSQL vs Socket.IO

Esta separación debe quedar muy clara.

## PostgreSQL

Responsabilidad:

```text
durabilidad
fuente de verdad
estado de notification
estado de deliveries
histórico
```

---

## RabbitMQ

Responsabilidad:

```text
integration events
procesamiento durable
ACK
retry
DLQ
```

Ejemplo:

```text
customer.updated
```

---

## Redis Pub/Sub

Responsabilidad:

```text
propagación realtime entre instancias
```

Características:

```text
rápido
efímero
sin replay durable
```

---

## Socket.IO

Responsabilidad:

```text
conexión realtime con cliente
rooms
namespaces
emit
```

---

# 26. Arquitectura completa

Una futura arquitectura podría quedar:

```text
Customer Service
↓
Outbox
↓
RabbitMQ
↓
Notification Service Worker
↓
PostgreSQL
↓
delivery in_app procesado
↓
IPC
↓
Main Thread
↓
Socket.IO
↓
Redis Adapter
↓
Redis
↓
todas las instancias Socket.IO
↓
room user:{id}
↓
cliente
```

Por ejemplo:

```text
                         RabbitMQ
                            ↓
                  Notification Instance #1
                            ↓
                       PostgreSQL
                            ↓
                           IPC
                            ↓
                       Socket.IO
                            ↓
                       Redis Adapter
                            ↓
                          Redis
                     /             \
                    /               \
                   ↓                 ↓
          Notification #1     Notification #2
             Socket.IO           Socket.IO
                 │                   │
                 ↓                   ↓
             local users         local users
                                     │
                                     ↓
                                   user:18
```

---

# 27. Qué pasa si Redis falla

Redis Pub/Sub no es nuestra fuente de verdad.

Por lo tanto:

```text
Redis falla
↓
realtime distribuido puede degradarse
```

pero:

```text
notification sigue en PostgreSQL
```

El usuario puede recuperar posteriormente:

```http
GET /api/v1/notifications
```

Eso significa que podemos tratar el realtime como:

```text
best-effort delivery
```

sin comprometer la persistencia del sistema.

---

# 28. Qué pasa si el usuario está offline

Ejemplo:

```text
notification creada
↓
delivery in_app
↓
PostgreSQL
↓
Redis
↓
Socket.IO
↓
user:18 no está conectado
```

No hay socket que reciba el evento.

Pero la notificación permanece:

```text
notifications
↓
read_at = NULL
```

Cuando el usuario entra después:

```text
GET /notifications
```

recupera la información.

Por eso no necesitamos que Redis conserve los mensajes.

---

# 29. Qué pasa si existen múltiples sockets del mismo usuario

Un usuario puede tener:

```text
Chrome
Firefox
móvil
otra pestaña
```

Todos pueden pertenecer a:

```text
user:18
```

Por ejemplo:

```text
user:18
├── socketA
├── socketB
├── socketC
└── socketD
```

Un emit:

```ts
io.to("user:18").emit(...)
```

se envía a todos los sockets del room.

Con Redis Adapter, esos sockets incluso pueden estar distribuidos:

```text
Instance #1

user:18
├── socketA
└── socketB


Instance #2

user:18
├── socketC
└── socketD
```

El emit puede alcanzar los cuatro.

---

# 30. Load Balancer

Cuando existan múltiples instancias normalmente habrá:

```text
Load Balancer
```

Ejemplo:

```text
                    Load Balancer
                   /            \
                  /              \
                 ↓                ↓
        Notification #1    Notification #2
```

Las conexiones Socket.IO terminarán distribuidas entre las instancias.

Redis permite que los eventos puedan llegar a las conexiones correctas sin que la aplicación tenga que saber:

```text
en qué instancia está conectado cada usuario
```

---

# 31. Sticky sessions

Cuando Socket.IO trabaja con múltiples instancias puede aparecer el concepto:

```text
sticky sessions
```

Su necesidad depende del transporte y de la configuración utilizada.

La idea general es que ciertas conexiones o handshakes pueden necesitar continuar llegando a la misma instancia.

Este tema debe estudiarse cuando integremos:

```text
load balancer
+
multiple replicas
+
Socket.IO
```

No es necesario resolverlo todavía para entender Redis Pub/Sub.

---

# 32. Testing que debemos hacer

## Test 1

Una sola instancia.

```text
Postman → Instance #1
```

Evento:

```text
Instance #1 → user:18
```

Resultado:

```text
mensaje recibido ✅
```

---

## Test 2

Dos instancias sin Redis.

```text
Postman → Instance #2
```

Evento emitido desde:

```text
Instance #1
```

Resultado esperado:

```text
mensaje NO recibido ❌
```

---

## Test 3

Dos instancias con Redis Pub/Sub manual.

```text
Instance #1
↓
Redis
↓
Instance #2
↓
user:18
```

Resultado:

```text
mensaje recibido ✅
```

---

## Test 4

Dos instancias con Redis Adapter.

Código:

```ts
io.to("user:18").emit(...)
```

Resultado:

```text
mensaje recibido independientemente
de la instancia donde esté conectado user:18
```

---

# 33. Logs recomendados durante las pruebas

Para aprender bien el flujo sería útil registrar:

```text
[INSTANCE-1] realtime event generated
```

```text
[INSTANCE-1] Redis PUBLISH room=user:18
```

```text
[INSTANCE-1] Redis message received
```

```text
[INSTANCE-2] Redis message received
```

```text
[INSTANCE-2] emitting locally room=user:18
```

Esto permite ver claramente:

```text
quién produjo
quién propagó
quién recibió
quién tenía el socket
```

---

# 34. Resultado final esperado

Después de implementar Redis distribuido:

```text
Notification Service puede tener:

1 instancia
2 instancias
5 instancias
10 instancias
```

y el código de negocio seguirá diciendo:

```text
enviar notificación a user:18
```

sin importar físicamente dónde está conectado el usuario.

Conceptualmente:

```text
App
↓
user:18
↓
Redis
↓
instancia correcta
↓
socket correcto
```

---

# 35. Resumen mental

Sin Redis:

```text
Socket.IO conoce solamente sockets locales
```

Con Redis:

```text
Socket.IO puede propagar eventos entre instancias
```

RabbitMQ:

```text
eventos de negocio durables
```

Redis:

```text
eventos realtime efímeros entre instancias
```

PostgreSQL:

```text
fuente de verdad
```

Socket.IO:

```text
entrega al cliente
```

IPC:

```text
comunicación Worker Thread → Main Thread
```

Redis:

```text
comunicación Instance → Instance
```

La idea central es:

> Cada vez que cruzamos una frontera de memoria necesitamos un mecanismo explícito de comunicación.

En StreamCRM:

```text
Worker
↓
IPC
↓
Main Thread
↓
Socket.IO
↓
Redis
↓
otras instancias Socket.IO
↓
cliente
```

Ese es el modelo completo de realtime distribuido que vamos a implementar.