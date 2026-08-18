# Incidente Docker Desktop + Elasticsearch + Prometheus

## Fecha

17 de agosto de 2026

---

## 1. Resumen del problema

Al levantar el entorno local de StreamCRM comenzaron a aparecer errores desde `winston-elasticsearch`:

```text
unavailable_shards_exception

primary shard is not active Timeout: [2s]
```

Ejemplo:

```text
[app-logs-customer-service-2026.08.17][0]
primary shard is not active
```

También comenzaron a ocurrir otros síntomas:

- Elasticsearch dejó de responder correctamente por momentos.
- Prometheus no levantó correctamente.
- Grafana tampoco quedó disponible.
- `docker ps` comenzó a devolver:

```text
500 Internal Server Error
```

contra el socket de Docker Desktop:

```text
/home/nvm23/.docker/desktop/docker.sock
```

La causa principal no estaba en StreamCRM ni directamente en Elasticsearch.

El problema estaba en **Docker Desktop / Docker Engine**, que había quedado en un estado incorrecto.

---

# 2. Síntoma inicial en Elasticsearch

Winston intentaba escribir logs y Elasticsearch respondía:

```text
unavailable_shards_exception
```

con:

```text
primary shard is not active
```

Esto significa que Elasticsearch conocía el índice, pero el `primary shard` necesario para aceptar escrituras todavía no estaba disponible.

Ejemplos de índices afectados:

```text
app-logs-notification-service-2026.08.17
```

```text
app-logs-customer-service-2026.08.17
```

---

# 3. Primera comprobación: estado del cluster

Comando:

```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

Resultado:

```json
{
  "cluster_name": "docker-cluster",
  "status": "yellow",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 67,
  "active_shards": 67,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 20,
  "unassigned_primary_shards": 0,
  "delayed_unassigned_shards": 0,
  "number_of_pending_tasks": 0,
  "number_of_in_flight_fetch": 0,
  "task_max_waiting_in_queue_millis": 0,
  "active_shards_percent_as_number": 77.01149425287356
}
```

## Interpretación

Lo importante era:

```text
unassigned_primary_shards = 0
```

Eso significa que todos los `primary shards` estaban activos en ese momento.

El estado:

```text
yellow
```

no era un problema grave.

El cluster tiene solamente un nodo Elasticsearch y los índices tienen réplicas.

Elasticsearch no puede colocar:

```text
primary
+
replica
```

del mismo shard en el mismo nodo.

Por eso aparecen réplicas:

```text
UNASSIGNED
```

y el cluster queda:

```text
yellow
```

Esto es esperado en un entorno local con un solo nodo.

---

# 4. Comprobación específica del shard

Comando:

```bash
curl "http://localhost:9200/_cat/shards/app-logs-customer-service-2026.08.17?v"
```

Resultado:

```text
index                                shard prirep state      docs   store
app-logs-customer-service-2026.08.17 0     p      STARTED
app-logs-customer-service-2026.08.17 0     r      UNASSIGNED
```

## Interpretación

```text
p STARTED
```

significa:

> El primary shard está funcionando correctamente.

Mientras que:

```text
r UNASSIGNED
```

significa:

> La réplica no puede asignarse porque solo existe un nodo Elasticsearch.

Por lo tanto, Elasticsearch podía indexar normalmente una vez terminado el recovery.

---

# 5. El verdadero problema: Docker Desktop

Posteriormente incluso comandos como:

```bash
docker ps -a
```

fallaron con:

```text
500 Internal Server Error
```

El contexto activo era:

```bash
docker context ls
```

Resultado relevante:

```text
desktop-linux *
```

con endpoint:

```text
unix:///home/nvm23/.docker/desktop/docker.sock
```

Después se ejecutó:

```bash
docker version
```

La parte del cliente funcionaba:

```text
Client: Docker Engine - Community
```

pero el servidor devolvía:

```text
500 Internal Server Error
```

Esto permitió identificar la situación:

```text
Docker CLI        ✅
Docker Desktop UI ✅
Docker Engine     ❌
```

La interfaz gráfica de Docker Desktop podía abrirse, pero el Engine interno estaba en un estado incorrecto.

---

# 6. Recuperación de Docker Desktop

Se reinició Docker Desktop / Docker Engine.

Después:

```bash
docker version
```

volvió a mostrar tanto:

```text
Client
```

como:

```text
Server: Docker Desktop
```

correctamente.

Ejemplo:

```text
Server: Docker Desktop 4.38.0
Engine:
  Version: 27.5.1
```

También apareció:

```text
API version: 1.47 (downgraded from 1.49)
```

Esto no era un error.

La CLI Docker era más nueva que el Engine de Docker Desktop y ambos negociaron una versión de API compatible.

Después:

```bash
docker ps
```

volvió a funcionar.

Los containers comenzaron a recuperarse:

```text
elasticsearch    health: starting
rabbitmq         health: starting
```

y posteriormente:

```text
elasticsearch    healthy
rabbitmq         healthy
```

---

# 7. ¿Por qué Elasticsearch siguió dando errores durante el arranque?

Aunque el proceso de Elasticsearch estuviera levantado, eso no significa que estuviera completamente listo.

Existe una diferencia importante:

```text
RUNNING
!=
READY
```

Elasticsearch utiliza almacenamiento persistente:

```yaml
volumes:
  - esdata:/usr/share/elasticsearch/data
```

Después de que Docker reinició, Elasticsearch tuvo que recuperar sus datos y shards desde ese volumen.

La secuencia fue aproximadamente:

```text
Docker Engine vuelve
↓
Elasticsearch process arranca
↓
puerto 9200 empieza a responder
↓
Elasticsearch recupera shards
↓
primary shards todavía no están todos disponibles
↓
customer-service / notification-service arrancan
↓
Winston manda logs
↓
primary shard todavía recuperándose
↓
unavailable_shards_exception
```

Posteriormente Elasticsearch terminó la recuperación:

```text
0 p STARTED
```

y las escrituras volvieron a funcionar normalmente.

---

# 8. Healthcheck útil para Elasticsearch

Para esperar hasta que Elasticsearch alcance al menos estado `yellow`:

```bash
curl "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=30s"
```

Resultado esperado:

```json
{
  "status": "yellow",
  "timed_out": false
}
```

Esto permite comprobar que:

- Elasticsearch está respondiendo.
- Los primary shards están disponibles.
- El cluster está preparado para trabajar en este entorno single-node.

---

# 9. Problema observado en Prometheus

Prometheus tampoco quedó correctamente disponible después del problema de Docker.

Al recuperarlo aparecieron logs como:

```text
A lockfile from a previous execution already existed. It was replaced
```

Después:

```text
Replaying WAL, this may take a while
```

y posteriormente:

```text
WAL replay completed
```

Finalmente:

```text
TSDB started
```

y:

```text
Server is ready to receive web requests.
```

También aparecieron mensajes:

```text
Found healthy block
```

Esto confirmó que los bloques persistidos estaban sanos.

---

# 10. ¿Qué significa el lockfile de Prometheus?

Prometheus utiliza un archivo de lock para indicar que su TSDB está siendo utilizada por una instancia.

Si Docker o el container se detienen de manera inesperada, el proceso anterior puede no alcanzar a limpiar el archivo de lock.

Entonces al volver a iniciar ocurre:

```text
Prometheus
↓
encuentra lock anterior
↓
comprueba/descarta la ejecución anterior
↓
reemplaza lock
↓
continúa
```

El warning:

```text
A lockfile from a previous execution already existed
```

no significaba necesariamente corrupción.

En este caso Prometheus pudo continuar normalmente.

---

# 11. ¿Qué es el WAL de Prometheus?

WAL significa:

```text
Write Ahead Log
```

Prometheus persiste información reciente en ese log antes de consolidarla completamente en bloques de TSDB.

Después de un reinicio inesperado puede reconstruir el estado reciente utilizando:

```text
datos persistidos
+
WAL
↓
replay
↓
TSDB reconstruida
```

Durante este incidente ocurrió:

```text
Found healthy block
↓
Replaying WAL
↓
WAL replay completed
↓
TSDB started
↓
Server is ready to receive web requests
```

Por lo tanto Prometheus recuperó correctamente su información.

---

# 12. Grafana

Grafana utiliza Prometheus como datasource para las métricas.

Cuando Prometheus volvió a estar disponible:

```text
Prometheus ✅
↓
Grafana datasource ✅
↓
Dashboard ✅
```

El dashboard volvió a mostrar las métricas correctamente.

No fue necesario eliminar los volúmenes persistentes.

---

# 13. Arquitectura involucrada

La infraestructura local se comporta aproximadamente así:

```text
Linux Host
↓
Docker Desktop
↓
Docker Engine
↓
Containers
├── PostgreSQL
├── RabbitMQ
├── Elasticsearch
├── Kibana
├── Prometheus
└── Grafana
```

Por lo tanto, si Docker Engine entra en un estado incorrecto:

```text
Docker Engine ❌
↓
PostgreSQL afectado
RabbitMQ afectado
Elasticsearch afectado
Prometheus afectado
Grafana afectado
Kibana afectado
```

Los síntomas pueden parecer problemas independientes cuando en realidad todos tienen una causa común debajo.

---

# 14. Procedimiento de diagnóstico si vuelve a ocurrir

## Paso 1 - Verificar Docker

Ejecutar:

```bash
docker version
```

Debe mostrar:

```text
Client
Server
```

Si aparece solamente:

```text
Client
```

y después:

```text
500 Internal Server Error
```

el problema está probablemente en Docker Desktop / Docker Engine.

---

## Paso 2 - Revisar el contexto

```bash
docker context ls
```

En este entorno el contexto utilizado es:

```text
desktop-linux
```

Endpoint:

```text
~/.docker/desktop/docker.sock
```

---

## Paso 3 - Revisar containers

```bash
docker ps -a
```

Buscar estados como:

```text
Restarting
Exited
health: starting
unhealthy
```

Si incluso este comando devuelve:

```text
500 Internal Server Error
```

no continuar diagnosticando Elasticsearch o Prometheus.

Primero resolver Docker Engine.

---

## Paso 4 - Si Docker Engine falla

Reiniciar Docker Desktop.

Después comprobar nuevamente:

```bash
docker version
```

y:

```bash
docker ps
```

No continuar con Elasticsearch hasta que Docker Engine esté respondiendo correctamente.

---

# 15. Diagnóstico de Elasticsearch

Primero comprobar el container:

```bash
docker ps
```

Esperar algo como:

```text
es-local ... (healthy)
```

Luego:

```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

Verificar especialmente:

```text
unassigned_primary_shards: 0
```

y:

```text
initializing_shards: 0
```

---

# 16. Revisar shards de un índice

```bash
curl "http://localhost:9200/_cat/shards/<INDEX>?v"
```

Ejemplo:

```bash
curl "http://localhost:9200/_cat/shards/app-logs-customer-service-2026.08.17?v"
```

Resultado correcto en este entorno single-node:

```text
0 p STARTED
0 r UNASSIGNED
```

Interpretación:

```text
p STARTED
```

Primary operativo.

```text
r UNASSIGNED
```

Réplica sin asignar porque solo existe un nodo.

---

# 17. Si vuelve a aparecer unavailable_shards_exception

Error:

```text
unavailable_shards_exception
primary shard is not active
```

NO empezar eliminando:

- índices
- volúmenes
- containers
- datos Elasticsearch

Primero ejecutar:

```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

Después:

```bash
curl "http://localhost:9200/_cat/shards/<INDEX>?v"
```

Si el primary aparece:

```text
STARTED
```

el error probablemente ocurrió temporalmente durante el startup/recovery.

También se puede esperar explícitamente:

```bash
curl "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=30s"
```

---

# 18. Diagnóstico de Prometheus

Ver estado:

```bash
docker compose ps -a prometheus
```

Ver logs:

```bash
docker compose logs prometheus --tail=100
```

Indicadores sanos:

```text
Found healthy block
```

```text
WAL replay completed
```

```text
TSDB started
```

```text
Completed loading of configuration file
```

```text
Server is ready to receive web requests.
```

---

# 19. Recrear solamente Prometheus y Grafana

Si Prometheus o Grafana necesitan recrearse sin tocar:

- RabbitMQ
- PostgreSQL
- Elasticsearch
- Kibana

usar:

```bash
docker compose stop prometheus grafana
```

Después:

```bash
docker compose rm -f prometheus grafana
```

Y finalmente:

```bash
docker compose up -d prometheus grafana
```

Esto no elimina automáticamente los volúmenes:

```text
promdata
grafanadata
```

por lo que la información persistida permanece.

---

# 20. Validar docker-compose antes de ejecutar cambios

Después de modificar `docker-compose.yml` ejecutar:

```bash
docker compose config
```

Esto permite detectar problemas como:

- indentación incorrecta
- propiedades en el nivel equivocado
- `healthcheck` mal colocado
- errores estructurales del YAML

Ejemplo del error visto durante este incidente:

```text
services.healthcheck Additional property interval is not allowed
```

Ese error fue causado por una estructura/indentación incorrecta del `healthcheck`.

---

# 21. No hacer esto inicialmente

Ante este tipo de incidente evitar comenzar con:

```bash
docker system prune
```

También evitar borrar directamente:

```text
esdata
promdata
grafanadata
rabbitmq_streamcrm_data
postgres_projects_data
```

Tampoco eliminar índices Elasticsearch sin haber diagnosticado antes.

Puede destruir información que realmente está sana.

---

# 22. Causa raíz probable del incidente

La secuencia más probable fue:

```text
Docker Desktop / Docker Engine entra en estado incorrecto
↓
Docker API comienza a responder 500
↓
containers dejan de ejecutarse normalmente
↓
Elasticsearch es interrumpido
Prometheus es interrumpido
↓
Docker Desktop / Engine reinicia
↓
containers vuelven a arrancar
↓
Elasticsearch comienza recuperación de shards
Prometheus comienza recuperación de TSDB
↓
Winston intenta enviar logs demasiado pronto
↓
primary shard todavía no está activo
↓
unavailable_shards_exception
↓
Elasticsearch termina recovery
↓
primary → STARTED
↓
Prometheus encuentra lock anterior
↓
Prometheus reproduce WAL
↓
TSDB started
↓
Prometheus ready
↓
Grafana vuelve a recibir métricas
↓
stack recuperado
```

---

# 23. Lección importante: running no significa ready

Un servicio puede estar ejecutándose sin estar listo para recibir tráfico.

```text
PROCESS RUNNING
!=
APPLICATION READY
```

Ejemplo:

```text
Elasticsearch process
✅ running

HTTP :9200
✅ puede responder

Primary shards
⏳ recovering

Writes
❌ todavía pueden fallar
```

Por esta razón existen mecanismos como:

```text
Docker healthchecks
Kubernetes startup probes
Kubernetes readiness probes
Kubernetes liveness probes
```

Un healthcheck útil no debería limitarse únicamente a comprobar que existe un proceso.

Idealmente debería comprobar que la aplicación está en condiciones de realizar su trabajo.

---

# 24. Estado final después del incidente

```text
Docker Desktop       ✅
Docker Engine        ✅
PostgreSQL           ✅
RabbitMQ             ✅
Elasticsearch        ✅ healthy
Primary shards       ✅ activos
Cluster              🟡 yellow esperado con 1 nodo
Kibana               ✅
Prometheus           ✅
Prometheus TSDB      ✅ recuperada
Grafana              ✅
Dashboards           ✅
Datos persistentes   ✅
```

No hubo evidencia de pérdida de información.

El incidente fue principalmente una falla temporal de Docker Desktop / Docker Engine seguida por el proceso normal de recuperación de servicios stateful como Elasticsearch y Prometheus.

---

# 25. Checklist rápido para la próxima vez

Si vuelve a pasar algo parecido:

```text
1. docker version
2. docker context ls
3. docker ps -a
4. Si Docker devuelve 500 → arreglar/reiniciar Docker Desktop primero
5. Esperar containers healthy
6. Revisar Elasticsearch cluster health
7. Revisar primary shards
8. Revisar Prometheus logs
9. Esperar TSDB + WAL recovery
10. Confirmar Grafana
```

Comandos principales:

```bash
docker version
```

```bash
docker context ls
```

```bash
docker ps -a
```

```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

```bash
curl "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=30s"
```

```bash
curl "http://localhost:9200/_cat/shards/<INDEX>?v"
```

```bash
docker compose ps -a prometheus grafana
```

```bash
docker compose logs prometheus --tail=100
```

La regla principal es:

> Si varios servicios de infraestructura empiezan a fallar simultáneamente, revisar primero la capa común que los ejecuta antes de asumir que cada servicio tiene un problema independiente.