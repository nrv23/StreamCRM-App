# RabbitMQ Policies vs `x-arguments`

## Problema

Supongamos que tenemos una cola:

``` text
notification-service
```

La aplicación la crea así:

``` ts
await channel.assertQueue("notification-service", {
    durable: true,
});
```

Después queremos agregar un Dead Letter Exchange (DLX):

``` ts
await channel.assertQueue("notification-service", {
    durable: true,
    arguments: {
        "x-dead-letter-exchange": "stream-crm.dlx",
    },
});
```

RabbitMQ responde:

``` text
PRECONDITION_FAILED
inequivalent arg 'x-dead-letter-exchange'
current is none
received stream-crm.dlx
```

## ¿Por qué ocurre?

Los `arguments` de `assertQueue()` forman parte de la definición
permanente de la cola.

Una vez creada, RabbitMQ no permite cambiar esos argumentos mediante
otra llamada a `assertQueue()`.

------------------------------------------------------------------------

# Desarrollo

En desarrollo la solución habitual es:

1.  Detener la aplicación.
2.  Eliminar la cola.
3.  Levantar nuevamente el servicio.

RabbitMQ recreará la cola con la nueva configuración.

------------------------------------------------------------------------

# Producción

Si la cola contiene miles de mensajes, eliminarla no es una opción.

Para estos casos RabbitMQ recomienda utilizar **Policies**.

La aplicación sigue declarando:

``` ts
await channel.assertQueue("notification-service", {
    durable: true,
});
```

Y la infraestructura aplica el comportamiento adicional.

Ejemplo:

``` bash
rabbitmqctl set_policy \
notification-service-dlx \
'^notification-service$' \
'{"dead-letter-exchange":"stream-crm.dlx"}' \
--apply-to queues
```

Esto modifica el comportamiento de la cola existente sin eliminarla ni
perder mensajes.

------------------------------------------------------------------------

# Ventajas de las Policies

-   Permiten agregar un DLX sin recrear la cola.
-   No se pierden mensajes.
-   Son administradas por infraestructura (DevOps, SRE, Helm, Terraform,
    etc.).
-   También sirven para configurar TTL, límites de cola, prioridades y
    otras opciones.

------------------------------------------------------------------------

# Resumen

**Desarrollo**

``` text
Cambiar configuración
↓
Eliminar cola
↓
RabbitMQ la recrea
```

**Producción**

``` text
Cola existente
↓
Aplicar Policy
↓
La cola conserva sus mensajes
```

  # Ver usuarios
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl list_users

# Crear usuario
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl add_user nvm2391 nvm2391

# Dar permisos en el vhost /
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl set_permissions -p / nvm2391 ".*" ".*" ".*"

# Dar acceso administrativo al panel web
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl set_user_tags nvm2391 administrator

# Verificar usuario y tag
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl list_users

# Verificar permisos
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl list_permissions -p /

# Probar credenciales
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl authenticate_user nvm2391 nvm2391

# Ver conexiones activas
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl list_connections user peer_host peer_port state

# Ver consumidores
docker exec -it rabbitmq-stream-crm \
  rabbitmqctl list_consumers

  // meter archivos de consumer, publisher y dlq en una sola carpeta en background en su respectiva carpeta.
  // para limpiar la arquiecttura
------------------------------------------------------------------------

# Conclusión

Los `x-arguments` son ideales cuando la cola se crea desde cero.

Para modificar el comportamiento de colas existentes en producción, la
práctica recomendada es utilizar **RabbitMQ Policies**, ya que permiten
cambiar configuraciones operativas sin eliminar la cola ni perder
mensajes.
