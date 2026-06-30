# Database Boundaries

## Microservice Database Ownership

```text
┌────────────────────┐      ┌────────────────────┐
│ auth-service        │      │ auth_db             │
│ owns users/roles    │─────▶│ users, roles, perms │
└────────────────────┘      └────────────────────┘

┌────────────────────┐      ┌────────────────────┐
│ customer-service    │      │ customer_db         │
│ owns customers      │─────▶│ customers, tags     │
└────────────────────┘      └────────────────────┘

┌────────────────────┐      ┌────────────────────┐
│ campaign-service    │      │ campaign_db         │
│ owns campaigns      │─────▶│ campaigns, recipients│
└────────────────────┘      └────────────────────┘

┌────────────────────┐      ┌────────────────────┐
│ import-service      │      │ import_db           │
│ owns imports        │─────▶│ batches, rows, errors│
└────────────────────┘      └────────────────────┘
```

## No Cross-Service Foreign Keys

No se crean FKs entre bases de datos distintas.

Ejemplo:

`campaign_recipients.customer_id` referencia lógica a Customer Service, pero no FK real.

## Snapshot Pattern

```text
campaign_recipients
├── customer_id
├── customer_name_snapshot
├── customer_email_snapshot
└── customer_phone_snapshot
```
