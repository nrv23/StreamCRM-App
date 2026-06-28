# 07 - Customer Service

## Responsabilidad

El Customer Service administra la información de clientes del CRM.

Es uno de los módulos centrales porque alimenta campañas, tickets, reportes e importaciones.

## Tecnologías

- Node.js.
- TypeScript.
- Express.
- PostgreSQL.
- Redis.
- RabbitMQ.
- Streams para importación masiva.
- Zod/Joi para DTO validation.

## Entidades principales

- customers.
- customer_tags.
- tags.
- customer_notes.
- customer_status_history.
- audit_logs.
- import_batches.
- import_batch_errors.

## Features

### Crear cliente

Campos:

- firstName.
- lastName.
- email.
- phone.
- country.
- status.
- tags.

Validaciones:

- Email válido.
- Teléfono opcional.
- Debe existir email o teléfono.
- No duplicados por email.
- Estado válido.

### Actualizar cliente

Debe registrar auditoría:

- Campo modificado.
- Valor anterior.
- Valor nuevo.
- Usuario que modifica.
- Fecha.

### Eliminar cliente

Recomendado usar soft delete mediante `deleted_at`.

### Buscar clientes

Filtros:

- Nombre.
- Email.
- Teléfono.
- País.
- Estado.
- Tags.
- Fecha de creación.

### Paginación

- Offset pagination para pantallas simples.
- Cursor pagination para listados grandes.

### Segmentación

Ejemplos:

- Clientes de Costa Rica.
- Clientes inactivos.
- Clientes creados en los últimos 30 días.
- Clientes con tag `vip`.

### Tags

Ejemplos:

- VIP.
- Inactive.
- New.
- High Value.
- Support Risk.

### Notas

Permite agregar notas internas al cliente.

### Historial de estado

Cada vez que cambia el status, guardar histórico.

## Importación masiva de clientes

Flujo:

```text
CSV Upload
 -> Readable Stream
 -> CSV Parser Transform
 -> Validation Transform
 -> Batch Producer
 -> RabbitMQ
 -> Customer Import Worker
 -> PostgreSQL
```

## Eventos publicados

### customer.created

```json
{
  "eventId": "uuid",
  "eventName": "customer.created",
  "occurredAt": "date",
  "correlationId": "uuid",
  "payload": {
    "customerId": "uuid",
    "email": "customer@email.com",
    "createdBy": "uuid"
  }
}
```

### customer.updated

```json
{
  "eventId": "uuid",
  "eventName": "customer.updated",
  "occurredAt": "date",
  "correlationId": "uuid",
  "payload": {
    "customerId": "uuid",
    "changedFields": ["email", "status"],
    "updatedBy": "uuid"
  }
}
```

### customer.import.completed

```json
{
  "eventId": "uuid",
  "eventName": "customer.import.completed",
  "occurredAt": "date",
  "correlationId": "uuid",
  "payload": {
    "importBatchId": "uuid",
    "totalRows": 100000,
    "successRows": 98500,
    "failedRows": 1500
  }
}
```

## Patrones aplicados

- Repository Pattern.
- Specification Pattern.
- Strategy Pattern.
- Observer Pattern.
- Cache Aside.

## Estrategia de cache

Keys sugeridas:

```text
customers:summary
customers:stats:country
customers:stats:status
customer:{customerId}
```

Invalidación:

- Al crear cliente.
- Al actualizar cliente.
- Al eliminar cliente.
- Al importar clientes.

## Tablas PostgreSQL sugeridas

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  country VARCHAR(80),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX idx_customers_email_unique
ON customers(email)
WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_customers_status
ON customers(status);

CREATE INDEX idx_customers_country_status
ON customers(country, status);

CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE customer_tags (
  customer_id UUID NOT NULL REFERENCES customers(id),
  tag_id UUID NOT NULL REFERENCES tags(id),
  PRIMARY KEY (customer_id, tag_id)
);

CREATE TABLE customer_notes (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE customer_status_history (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

## APIs

```http
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id

GET    /api/v1/customers/:id/notes
POST   /api/v1/customers/:id/notes

GET    /api/v1/customers/:id/history
POST   /api/v1/customers/import
```
