# Notification Service - WebSockets y Sockets Distribuidos con Redis

## 1. Objetivo

El objetivo de WebSocket dentro de `notification-service` es permitir que el frontend reciba notificaciones en tiempo real sin tener que consultar constantemente la API REST.

La arquitectura queda conceptualmente así:

```text
Evento ocurre en el sistema
        ↓
Notification Service
        ↓
Guardar notification en PostgreSQL
        ↓
Emitir evento por WebSocket
        ↓
Frontend recibe la notificación
```

REST y WebSocket cumplen responsabilidades diferentes.

```text
REST
→ consultar estado persistido

WebSocket
→ recibir cambios en tiempo real
```

Por ejemplo:

```text
GET /api/v1/notifications

→ devuelve historial de notificaciones
```

Mientras que WebSocket permite:

```text
notification.created
→ llega inmediatamente al navegador
```

---

# 2. Flujo básico

Supongamos que ocurre un evento:

```text
report.generated
```

El flujo podría ser:

```text
Report Service
      ↓
RabbitMQ
      ↓
Notification Service
      ↓
Integration Event Consumer
      ↓
crear notification
      ↓
crear notification_delivery
      ↓
COMMIT PostgreSQL
      ↓
Socket Gateway
      ↓
emit notification.created
      ↓
Frontend
```

El frontend recibe algo parecido a:

```json
{
  "event": "notification.created",
  "data": {
    "notification_id": 55,
    "title": "Report generated",
    "message": "Your report is ready",
    "type": "success",
    "created_at": "2026-08-15T10:00:00.000Z"
  }
}
```

Entonces puede actualizar inmediatamente:

```text
🔔 3
↓
🔔 4
```

y agregar la notificación al listado visible.

---

# 3. PostgreSQL sigue siendo la fuente de verdad

La notificación debe persistirse antes de intentar enviarla por WebSocket.

Evitar:

```text
emit WebSocket
      ↓
usuario recibe notificación
      ↓
INSERT PostgreSQL falla
```

Eso produciría una notificación visible para el usuario pero inexistente en la base de datos.

La secuencia correcta es:

```text
BEGIN

INSERT notification

INSERT notification_delivery

COMMIT

↓ después

emit WebSocket
```

Por lo tanto:

```text
PostgreSQL
→ fuente de verdad

WebSocket
→ mecanismo de entrega en tiempo real
```

---

# 4. ¿Qué pasa si el usuario está desconectado?

No debería ser un problema.

Ejemplo:

```text
notification creada ✅

PostgreSQL ✅

usuario desconectado

WebSocket ❌
```

La notificación sigue existiendo.

Cuando el usuario vuelva a entrar:

```http
GET /api/v1/notifications
```

recuperará las notificaciones persistidas.

Esto demuestra por qué WebSocket no reemplaza REST.

```text
WebSocket
→ actualización en tiempo real

REST
→ recuperación del estado actual
```

---

# 5. Identificación del usuario

Cuando el usuario abre el frontend:

```text
Login
↓
JWT
↓
Frontend abre WebSocket
↓
Notification Service valida JWT
↓
Obtiene user_id
↓
Asocia socket con ese usuario
```

Conceptualmente:

```text
socket A
→ user 25

socket B
→ user 80

socket C
→ user 25
```

El mismo usuario puede tener varias conexiones abiertas.

Por ejemplo:

```text
user 25

├── Chrome
├── Firefox
└── teléfono
```

Todas deberían poder recibir la misma notificación.

---

# 6. Namespace

Socket.IO permite separar conexiones utilizando namespaces.

Ejemplo:

```text
/
├── /notifications
├── /chat
└── /admin
```

Para Stream CRM podemos comenzar simplemente con:

```text
/notifications
```

La conexión sería conceptualmente:

```text
Frontend
↓
Socket.IO
↓
namespace /notifications
```

Dentro de ese namespace tendremos diferentes rooms.

---

# 7. Rooms

Las rooms permiten agrupar sockets dentro de un namespace.

Ejemplo:

```text
/notifications

├── user:25
├── user:80
├── campaign:10
└── import:55
```

Un socket puede estar dentro de múltiples rooms.

Por ejemplo:

```text
socket ABC

namespace:
/notifications

rooms:

user:25
campaign:10
```

Eso significa que puede recibir:

```text
notificaciones personales
+
eventos de campaign 10
```

---

# 8. Room por usuario

Cuando un usuario conecta:

```text
JWT
↓
user_id = 25
↓
socket.join("user:25")
```

Conceptualmente:

```ts
socket.join(`user:${userId}`);
```

Luego para enviar una notificación únicamente a ese usuario:

```ts
io
  .of('/notifications')
  .to(`user:${userId}`)
  .emit('notification.created', notification);
```

Ejemplo:

```text
userId = 25
```

Entonces:

```text
room
=
user:25
```

Todos los sockets dentro de:

```text
user:25
```

reciben la notificación.

---

# 9. Varias pestañas o dispositivos

Supongamos:

```text
user 25
```

tiene:

```text
Chrome laptop
Firefox laptop
Mobile
```

Cada dispositivo crea un socket diferente:

```text
socket A
socket B
socket C
```

Pero todos entran a:

```text
room = user:25
```

Entonces:

```text
io.to("user:25")
```

envía el evento a los tres.

Esto evita tener que guardar manualmente:

```text
userId → socketId
```

como una relación uno a uno.

---

# 10. Rooms futuras

La documentación del proyecto contempla:

```text
ws:user:{userId}

ws:campaign:{campaignId}

ws:import:{batchId}
```

Conceptualmente podrían convertirse en rooms:

```text
user:25

campaign:100

import:350
```

Ejemplo:

```text
/notifications
├── user:25
├── user:26
├── campaign:100
├── campaign:101
├── import:350
└── import:351
```

---

# 11. Notificaciones personales

Ejemplo:

```text
notification.user_id = 25
```

Entonces:

```ts
io
  .of('/notifications')
  .to('user:25')
  .emit('notification.created', notification);
```

Solo el usuario 25 recibe el evento.

---

# 12. Campañas

Supongamos que varios usuarios están observando:

```text
campaign 100
```

Pueden entrar a:

```text
campaign:100
```

Entonces notification-service puede emitir:

```ts
io
  .of('/notifications')
  .to('campaign:100')
  .emit('campaign.progress', data);
```

Todos los clientes interesados en esa campaña reciben el evento.

Ejemplo:

```json
{
  "campaign_id": 100,
  "processed": 850,
  "total": 1000,
  "percentage": 85
}
```

---

# 13. Imports

El mismo concepto puede usarse para imports.

Room:

```text
import:250
```

Eventos:

```text
import.progress

import.completed

import.failed
```

Ejemplo:

```ts
io
  .of('/notifications')
  .to('import:250')
  .emit('import.progress', {
      processed: 500,
      total: 1000
  });
```

---

# 14. Evento WebSocket inicial

No necesitamos crear diez eventos de inmediato.

Para comenzar:

```text
notification.created
```

es suficiente.

Flujo:

```text
notification creada
↓
persistida
↓
emit notification.created
↓
frontend
```

Después podríamos agregar:

```text
notification.updated

campaign.progress

campaign.completed

import.progress

import.completed

report.generated
```

según las necesidades reales.

---

# 15. Separar WebSocket de RabbitMQ

No conviene meter directamente Socket.IO dentro del consumer de RabbitMQ.

Evitar:

```ts
channel.consume(queue, async message => {

    // guardar notification

    io
      .to(...)
      .emit(...);

});
```

Eso acopla demasiado:

```text
RabbitMQ
+
DB
+
Socket.IO
```

El consumer debería encargarse principalmente de procesar el evento de integración.

Una separación más limpia sería:

```text
RabbitMQ Consumer
↓
Integration Event Handler
↓
Notification Service
↓
persist notification
↓
Realtime Publisher
↓
Socket Gateway
```

---

# 16. Abstracción para tiempo real

Podemos definir una interfaz:

```ts
export interface NotificationRealtimePublisher {

    publishToUser(
        userId: number,
        notification: NotificationRealtimeDto
    ): Promise<void>;

}
```

Después implementar:

```text
SocketIONotificationPublisher
```

Conceptualmente:

```ts
export class SocketIONotificationPublisher
    implements NotificationRealtimePublisher {

    constructor(
        private readonly io: Server
    ) {}

    async publishToUser(
        userId: number,
        notification: NotificationRealtimeDto
    ): Promise<void> {

        this.io
            .of('/notifications')
            .to(`user:${userId}`)
            .emit(
                'notification.created',
                notification
            );
    }
}
```

Así la capa de negocio no necesita conocer detalles de Socket.IO.

---

# 17. Socket Gateway

Podemos tener una clase responsable de administrar conexiones.

Ejemplo conceptual:

```text
NotificationSocketGateway

Responsabilidades:

- crear namespace
- autenticar sockets
- obtener user_id
- crear/join rooms
- manejar disconnect
- emitir eventos
```

Ejemplo conceptual:

```ts
class NotificationSocketGateway {

    constructor(
        private readonly io: Server
    ) {}

    initialize() {

        const namespace =
            this.io.of('/notifications');

        namespace.use(
            authenticationMiddleware
        );

        namespace.on(
            'connection',
            socket => {

                const userId =
                    socket.data.userId;

                socket.join(
                    `user:${userId}`
                );

                socket.on(
                    'disconnect',
                    () => {
                        // cleanup si fuera necesario
                    }
                );
            }
        );
    }
}
```

---

# 18. Autenticación del WebSocket

El frontend debe enviar el token durante el handshake.

Conceptualmente:

```text
Frontend

socket.connect({
    auth: {
        token: JWT
    }
})
```

Notification Service:

```text
handshake
↓
obtener token
↓
validar JWT
↓
obtener user_id
↓
socket.data.userId
↓
join room
```

Un cliente no debe poder simplemente decir:

```text
quiero entrar a user:500
```

sin autorización.

El servidor decide qué room corresponde al usuario.

---

# 19. Seguridad de rooms

Evitar:

```ts
socket.on('join-user-room', userId => {

    socket.join(`user:${userId}`);

});
```

porque un cliente malicioso podría intentar:

```text
join user:1
join user:2
join user:3
...
```

Mejor:

```text
JWT
↓
server obtiene user_id
↓
server decide room
```

Ejemplo:

```ts
const userId = socket.data.userId;

socket.join(`user:${userId}`);
```

---

# 20. Arquitectura inicial con una sola instancia

Primera versión:

```text
                        ┌─────────────┐
                        │  Frontend   │
                        └──────┬──────┘
                               │
                            Socket.IO
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Notification Service │
                    │                      │
RabbitMQ ──────────→│ Consumer             │
                    │      ↓               │
                    │ PostgreSQL           │
                    │      ↓               │
                    │ Socket Gateway       │
                    └──────────────────────┘
```

Esto funciona perfectamente con una sola instancia.

---

# 21. El problema cuando hay varias instancias

Ahora supongamos que escalamos:

```text
Notification Service #1

Notification Service #2

Notification Service #3
```

Normalmente habría:

```text
Load Balancer
```

delante.

Ejemplo:

```text
                  Load Balancer
                 /      |       \
                /       |        \
               ▼        ▼         ▼

            NS #1     NS #2      NS #3
```

Los usuarios pueden quedar conectados a diferentes instancias.

Ejemplo:

```text
User 25
↓
WebSocket
↓
Notification Service #2
```

Pero RabbitMQ podría entregar un evento a:

```text
Notification Service #1
```

Entonces ocurre un problema.

---

# 22. Problema de sockets distribuidos

Supongamos:

```text
User 25
```

tiene su WebSocket conectado a:

```text
Instance #2
```

Entonces:

```text
Instance #2

room user:25
└── socket ABC
```

Pero RabbitMQ manda la notificación a:

```text
Instance #1
```

Instance #1 intenta:

```text
emit user:25
```

pero localmente no tiene ese socket.

Conceptualmente:

```text
RabbitMQ
↓
Notification Service #1

user:25 socket
NO EXISTE AQUÍ
```

Mientras:

```text
Notification Service #2

user:25 socket
SÍ EXISTE AQUÍ
```

La memoria de cada proceso es independiente.

---

# 23. Por qué las rooms no se comparten automáticamente

Las rooms de Socket.IO viven normalmente dentro de la memoria del proceso.

Ejemplo:

```text
Instance #1 memory

user:10
user:20
```

```text
Instance #2 memory

user:25
user:30
```

Instance #1 no sabe automáticamente qué sockets existen en Instance #2.

Por eso necesitamos una forma de comunicación entre instancias.

---

# 24. Redis Pub/Sub

Redis puede actuar como canal de comunicación entre todas las instancias de notification-service.

Arquitectura:

```text
                Redis
             Pub / Sub
          /      |       \
         /       |        \
        ▼        ▼         ▼

Notification Notification Notification
Service #1   Service #2   Service #3
```

Todas las instancias pueden:

```text
publish
+
subscribe
```

---

# 25. Flujo distribuido con Redis

Supongamos nuevamente:

```text
User 25
```

está conectado a:

```text
Notification Service #2
```

RabbitMQ entrega evento a:

```text
Notification Service #1
```

Entonces:

```text
RabbitMQ
↓
Notification Service #1
↓
guardar notification PostgreSQL
↓
COMMIT
↓
Redis PUBLISH
ws:user:25
↓
Redis
↓
todas las instancias reciben mensaje
↓
Notification Service #2
↓
encuentra room user:25
↓
Socket.IO emit
↓
User 25
```

Este es el concepto central de WebSockets distribuidos.

---

# 26. Diagrama completo

```text
                         ┌───────────────┐
                         │   RabbitMQ    │
                         └───────┬───────┘
                                 │
                                 ▼
                      Notification Service #1
                                 │
                                 │
                           PostgreSQL
                                 │
                              COMMIT
                                 │
                                 ▼
                         Redis PUBLISH
                        channel user:25
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
             Service #1      Service #2      Service #3
                                 │
                                 │
                           room user:25
                                 │
                                 ▼
                              socket
                                 │
                                 ▼
                              Browser
```

---

# 27. Redis channels

En nuestra documentación tenemos:

```text
ws:user:{userId}

ws:campaign:{campaignId}

ws:import:{batchId}
```

Ejemplos:

```text
ws:user:25

ws:campaign:100

ws:import:250
```

---

# 28. Publicación a Redis

Ejemplo conceptual:

```ts
await redis.publish(
    `ws:user:${userId}`,
    JSON.stringify({
        event: 'notification.created',
        data: notification
    })
);
```

Redis distribuye ese mensaje a los subscribers.

---

# 29. Subscriber Redis

Cada instancia de notification-service escucha mensajes.

Ejemplo conceptual:

```ts
await redisSubscriber.subscribe(
    `ws:user:${userId}`
);
```

Al recibir:

```json
{
  "event": "notification.created",
  "data": {
    "notification_id": 55
  }
}
```

la instancia puede hacer:

```ts
io
  .of('/notifications')
  .to(`user:${userId}`)
  .emit(
      'notification.created',
      data
  );
```

---

# 30. Problema de subscribirse a millones de channels

Hay que tener cuidado con crear una suscripción Redis independiente por cada usuario si el sistema escala muchísimo.

Otra estrategia puede ser utilizar canales más generales.

Por ejemplo:

```text
notification-events
```

Payload:

```json
{
  "target": "user",
  "target_id": 25,
  "event": "notification.created",
  "data": {}
}
```

Cada instancia recibe el evento y revisa si tiene sockets para:

```text
user:25
```

Conceptualmente:

```text
Redis
↓
notification-events
↓
todas las instancias
↓
cada instancia revisa sus rooms locales
```

Para un proyecto como Stream CRM ambas aproximaciones son válidas para aprender.

---

# 31. Redis Adapter de Socket.IO

Socket.IO también dispone del concepto de adapter.

Normalmente Socket.IO utiliza un adapter en memoria.

Conceptualmente:

```text
Socket.IO
↓
Memory Adapter
↓
rooms locales
```

Cuando queremos distribuir rooms entre varias instancias podemos utilizar un adapter respaldado por Redis.

Entonces:

```text
Socket.IO #1
        \
         Redis Adapter
        /
Socket.IO #2
```

Esto permite que:

```ts
io.to('user:25').emit(...)
```

pueda propagarse entre instancias.

Conceptualmente:

```text
Service #1

io.to("user:25").emit(...)
↓
Redis Adapter
↓
Service #2
↓
socket user:25
```

Esto evita implementar manualmente parte del Pub/Sub.

---

# 32. Dos posibles estrategias con Redis

Podemos hacer:

## Estrategia A

Redis Pub/Sub manual.

```text
Notification Service
↓
redis.publish(...)
↓
otras instancias
↓
Socket Gateway
```

Ventaja:

```text
control explícito
```

Permite aprender muy bien cómo funciona la distribución.

---

## Estrategia B

Socket.IO Redis Adapter.

```text
Socket.IO
↓
Redis Adapter
↓
Socket.IO instances
```

Ventaja:

```text
menos código manual
```

Socket.IO se encarga de propagar eventos entre instancias.

Para producción, esta alternativa suele ser muy cómoda.

Para aprendizaje, vale muchísimo entender primero qué problema está resolviendo.

---

# 33. Arquitectura con Redis Adapter

Conceptualmente:

```text
                    Load Balancer
                 /        |        \
                /         |         \
               ▼          ▼          ▼

       Notification   Notification   Notification
       Service #1     Service #2     Service #3
             \            |            /
              \           |           /
               └──── Redis Adapter ───┘
                         │
                         │
                      Redis
```

Ahora:

```text
User 25
↓
socket
↓
Service #2
```

Pero Service #1 puede ejecutar:

```ts
io
  .of('/notifications')
  .to('user:25')
  .emit('notification.created', data);
```

El adapter distribuye el evento.

---

# 34. Redis no reemplaza PostgreSQL

Redis aquí NO debería ser la fuente de verdad.

```text
PostgreSQL
→ persistence

Redis
→ distribución en tiempo real

Socket.IO
→ conexión con frontend
```

Si Redis falla temporalmente:

```text
real-time notification
puede fallar
```

pero la notificación sigue guardada en PostgreSQL.

Luego el usuario puede recuperarla con:

```http
GET /api/v1/notifications
```

Eso hace el sistema mucho más robusto.

---

# 35. Redis Pub/Sub no es una cola durable

Redis Pub/Sub tiene una característica importante:

```text
si subscriber no está conectado
el mensaje puede perderse
```

Por eso no deberíamos usar Redis Pub/Sub como sustituto de RabbitMQ para eventos críticos.

RabbitMQ:

```text
mensajería durable
procesamiento
retries
DLQ
```

Redis Pub/Sub:

```text
fan-out rápido
comunicación temporal
real-time
```

Son problemas diferentes.

---

# 36. RabbitMQ vs Redis Pub/Sub

## RabbitMQ

Usar para:

```text
integration events

procesamiento asíncrono

eventos importantes

retries

dead letter queues
```

Ejemplo:

```text
customer.created
```

---

## Redis Pub/Sub

Usar para:

```text
propagar mensajes entre instancias

actualizaciones WebSocket

eventos efímeros de tiempo real
```

Ejemplo:

```text
ws:user:25
```

---

# 37. Arquitectura distribuida completa

```text
Customer Service
      │
      │ event
      ▼
RabbitMQ
      │
      ▼
Notification Service Instance #1
      │
      ├── PostgreSQL
      │
      └── Socket.IO
              │
              │
             Redis
        Pub/Sub / Adapter
         /      |      \
        ▼       ▼       ▼

      NS #1   NS #2   NS #3
                │
                │ room user:25
                ▼
              socket
                │
                ▼
             Browser
```

---

# 38. Flujo completo de una notificación

```text
1. Customer Service crea evento.

2. Evento se guarda en Outbox.

3. Outbox Publisher publica a RabbitMQ.

4. Notification Service consume evento.

5. Notification Service valida idempotencia.

6. Crea notification.

7. Crea notification_delivery.

8. PostgreSQL COMMIT.

9. Notification Service intenta entregar en tiempo real.

10. Publica mensaje mediante Redis
    o Socket.IO Redis Adapter.

11. La instancia que posee el socket recibe el mensaje.

12. Socket.IO emite notification.created.

13. Frontend recibe evento.

14. Frontend actualiza UI.

15. Si usuario estaba desconectado:
    no importa.

16. Al volver:
    GET /api/v1/notifications
    recupera estado persistido.
```

---

# 39. Separación de responsabilidades

Idealmente:

```text
RabbitMQ Consumer
→ consumir integration events

Notification Service
→ lógica del dominio

Repository
→ PostgreSQL

Realtime Publisher
→ abstracción de real-time

Socket Gateway
→ conexiones Socket.IO

Redis
→ comunicación entre instancias
```

Evitar una clase gigante que haga:

```text
RabbitMQ
+
PostgreSQL
+
Redis
+
Socket.IO
+
JWT
```

---

# 40. Posible estructura de carpetas

Conceptualmente:

```text
notification-service

src/
├── application/
│   ├── services/
│   └── use-cases/
│
├── domain/
│   ├── entities/
│   └── interfaces/
│
├── infrastructure/
│   ├── database/
│   ├── rabbitmq/
│   ├── redis/
│   └── websocket/
│       ├── notification-socket.gateway.ts
│       └── socketio-notification.publisher.ts
│
└── presentation/
    ├── controllers/
    └── routes/
```

No es obligatorio exactamente así.

La idea importante es separar:

```text
negocio
de
transporte
```

---

# 41. Primera fase recomendada

No implementar Redis inmediatamente.

Primero:

```text
Socket.IO
↓
namespace /notifications
↓
JWT
↓
room user:{userId}
↓
notification.created
```

Probar:

```text
browser conectado
↓
notification creada
↓
evento recibido
```

---

# 42. Segunda fase recomendada

Después introducir Redis.

```text
Notification Service #1
Notification Service #2
↓
Redis
↓
rooms distribuidas
```

Probar:

```text
socket conectado a instance #2

evento procesado por instance #1

↓

user recibe notificación
```

Ese laboratorio demuestra realmente por qué Redis es necesario.

---

# 43. Laboratorio ideal de sockets distribuidos

Levantar:

```text
notification-service-1
notification-service-2
redis
rabbitmq
postgres
```

Usuario conecta a:

```text
notification-service-2
```

RabbitMQ consumer procesa en:

```text
notification-service-1
```

Sin Redis:

```text
notification no llega
```

Con Redis:

```text
instance #1
↓
Redis
↓
instance #2
↓
socket
↓
notification llega
```

Ese experimento demuestra claramente el problema y la solución.

---

# 44. Métricas futuras para sockets

Cuando WebSocket funcione podemos agregar métricas Prometheus.

Ejemplo:

```text
websocket_connections
```

Tipo:

```text
Gauge
```

Porque puede:

```text
subir
y
bajar
```

Ejemplo:

```text
10
15
22
18
7
```

---

Otra métrica:

```text
websocket_events_sent_total
```

Tipo:

```text
Counter
```

Cuenta eventos enviados.

---

Otra:

```text
websocket_delivery_failures_total
```

Tipo:

```text
Counter
```

Cuenta errores de entrega WebSocket.

---

# 45. Logs útiles

Ejemplos:

```text
socket.connected

socket.disconnected

socket.auth.failed

socket.room.joined

notification.websocket.sent

notification.websocket.failed
```

Campos útiles:

```text
service

user_id

socket_id

room

event

timestamp
```

Evitar logs excesivos por cada operación interna si no aportan información.

---

# 46. Tracing futuro

Más adelante OpenTelemetry podría mostrar algo como:

```text
TRACE

customer.created
      ↓
Outbox publish
      ↓
RabbitMQ
      ↓
Notification Consumer
      ↓
INSERT notification
      ↓
Redis publish
      ↓
Socket emit
```

Esto permitiría observar todo el recorrido de una notificación.

---

# 47. Modelo mental final

Una instancia:

```text
RabbitMQ
↓
Notification Service
↓
PostgreSQL
↓
Socket.IO
↓
Browser
```

Varias instancias:

```text
RabbitMQ
↓
Notification Service #1
↓
PostgreSQL
↓
Redis
↓
Notification Service #2
↓
Socket.IO
↓
Browser
```

---

# 48. Responsabilidades

```text
PostgreSQL
→ guardar notificaciones

RabbitMQ
→ entregar integration events

Notification Service
→ procesar dominio

Socket.IO
→ comunicación real-time con frontend

Rooms
→ agrupar sockets

Namespaces
→ separar grandes canales de conexión

Redis
→ comunicar instancias de Notification Service

REST
→ recuperar estado persistido
```

---

# 49. Namespace vs Room

Namespace:

```text
/notifications
```

Representa una separación grande dentro del servidor Socket.IO.

Rooms:

```text
user:25

campaign:100

import:250
```

Representan grupos de sockets dentro del namespace.

Jerarquía:

```text
Socket.IO Server

└── /notifications
    ├── user:25
    ├── user:30
    ├── campaign:100
    └── import:250
```

---

# 50. Punto más importante

WebSocket debe considerarse:

```text
mecanismo de entrega en tiempo real
```

No:

```text
fuente de verdad
```

La fuente de verdad sigue siendo PostgreSQL.

Por eso el sistema tolera:

```text
usuario desconectado

socket caído

Redis temporalmente caído
```

sin perder permanentemente la notificación.

El usuario siempre puede recuperar el estado mediante:

```http
GET /api/v1/notifications
```

---

# 51. Resumen

La primera implementación será:

```text
Socket.IO
↓
namespace /notifications
↓
JWT authentication
↓
room user:{userId}
↓
notification.created
↓
frontend
```

Después escalaremos a:

```text
Notification Service #1
Notification Service #2
Notification Service #3
↓
Redis
↓
WebSockets distribuidos
```

La idea clave del escalamiento es:

```text
cada proceso tiene su propia memoria
```

Por lo tanto:

```text
el socket de un usuario puede vivir
en una instancia distinta
de aquella que procesó el evento
```

Redis permite comunicar esas instancias.

Arquitectura final:

```text
RabbitMQ
   ↓
Notification Service
   ↓
PostgreSQL
   ↓
Redis
   ↓
Socket.IO instances
   ↓
Rooms
   ↓
Frontend
```

Esto convierte la capa de notificaciones en tiempo real en un sistema distribuido capaz de escalar horizontalmente sin depender de que todos los usuarios estén conectados al mismo proceso.