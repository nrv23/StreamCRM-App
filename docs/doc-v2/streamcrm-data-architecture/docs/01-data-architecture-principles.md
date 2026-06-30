# 01 - Data Architecture Principles

## Database per Service

Cada servicio tiene su propia base de datos.

Ejemplo:

```text
auth-service        -> auth_db
customer-service    -> customer_db
campaign-service    -> campaign_db
ticket-service      -> ticket_db
import-service      -> import_db
report-service      -> report_db
notification-service-> notification_db
orchestrator-service-> orchestrator_db
```

## No Cross-Service Joins

No se permiten joins entre bases de datos de microservicios distintos.

Incorrecto:

```sql
SELECT *
FROM campaign_db.campaigns c
JOIN customer_db.customers cu ON cu.id = c.customer_id;
```

Correcto:

- Usar eventos.
- Usar APIs.
- Guardar snapshots.
- Crear read models.

## Snapshots

Cuando un servicio necesita datos de otro, guarda un snapshot mínimo.

Ejemplo en `campaign_recipients`:

```text
customer_id
customer_name_snapshot
customer_email_snapshot
customer_phone_snapshot
```

Esto permite que Campaign Service siga funcionando aunque Customer Service esté temporalmente caído.

## Consistencia eventual

El sistema no busca consistencia fuerte en todos los módulos.

Ejemplo:

Un cliente puede cambiar su correo en Customer Service, pero una campaña ya creada conserva el email snapshot usado en ese momento.

## Transactional Outbox

Todo evento relevante se guarda primero en PostgreSQL y luego se publica a RabbitMQ.

## Idempotencia

Todo consumidor debe poder procesar el mismo evento más de una vez sin duplicar datos.

Estrategias:

- Unique constraints.
- Event IDs procesados.
- Upserts.
- Locks.
- Estados transaccionales.

## Auditoría

Cambios importantes deben registrarse.

Ejemplos:

- Cliente actualizado.
- Ticket reasignado.
- Campaña iniciada.
- Reporte generado.
- Job fallido.
