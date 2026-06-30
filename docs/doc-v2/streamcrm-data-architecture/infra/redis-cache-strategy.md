# Redis Cache Strategy

## Usos principales

- Sesiones.
- Permisos.
- Rate limiting.
- Progreso de importaciones.
- Progreso de campañas.
- Pub/Sub para WebSocket.
- Locks distribuidos.
- Métricas temporales.

## Keys sugeridas

### Auth

```text
auth:permissions:user:{userId}
auth:session:{sessionId}
auth:login:attempts:{email}
```

### Customer

```text
customer:{customerId}
customers:stats:status
customers:stats:country
customers:summary
```

### Import

```text
import:progress:{batchId}
```

### Campaign

```text
campaign:progress:{campaignId}
campaign:stats:{campaignId}
```

### Notification Pub/Sub

```text
ws:user:{userId}
ws:campaign:{campaignId}
ws:import:{batchId}
```

## Estrategia

Usar Cache Aside:

```text
1. Buscar en Redis
2. Si no existe, consultar PostgreSQL
3. Guardar en Redis con TTL
4. Invalidar cuando cambie la entidad
```

## TTL sugeridos

```text
permissions: 15 min
customer detail: 5 min
dashboard stats: 30 sec
campaign progress: 1 hour
import progress: 1 hour
```
