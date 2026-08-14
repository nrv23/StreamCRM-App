# Minicurso de Prometheus, PromQL y Grafana para Stream CRM

## 1. Modelo mental

La arquitectura de métricas funciona así:

```text
Aplicación Node.js
      ↓
GET /metrics
      ↓
Prometheus
      ↓
PromQL
      ↓
Grafana
```

La aplicación expone métricas.

Prometheus consulta periódicamente el endpoint `/metrics` y almacena esos valores como series temporales.

Grafana consulta Prometheus mediante PromQL y convierte los resultados en gráficos, indicadores y dashboards.

---

# 2. ¿Dónde hago las consultas?

Las queries PromQL se pueden probar directamente en Prometheus.

Normalmente:

```text
http://localhost:9090
```

También se pueden ejecutar desde Grafana.

En Grafana:

```text
Explore
→ seleccionar Prometheus
→ escribir PromQL
→ Run query
```

O dentro de un Dashboard:

```text
Dashboard
→ Add visualization
→ Prometheus
→ escribir PromQL
```

Una buena práctica es:

```text
Primero probar query en Prometheus o Grafana Explore
↓
Confirmar que devuelve lo esperado
↓
Crear panel en Dashboard
```

---

# 3. Counter: http_requests_total

En Customer Service tenemos:

```promql
http_requests_total
```

Es un Counter.

Un Counter es una métrica acumulativa que normalmente solo aumenta.

Ejemplo:

```text
http_requests_total{
    method="GET",
    route="/api/v1/customers",
    status="200"
} 25
```

Esto significa:

```text
GET /api/v1/customers
status = 200

ha ocurrido 25 veces
```

Si ocurre otra request:

```text
25
↓
26
```

El Counter sigue aumentando mientras el proceso esté funcionando.

Si el proceso reinicia, el Counter puede volver a empezar desde cero.

---

# 4. Labels

Las labels permiten dividir una misma métrica en diferentes series.

Por ejemplo:

```text
method
route
status
```

Podemos tener:

```text
http_requests_total{
    method="GET",
    route="/api/v1/customers",
    status="200"
}

http_requests_total{
    method="POST",
    route="/api/v1/customers",
    status="201"
}

http_requests_total{
    method="GET",
    route="/api/v1/customers/:id",
    status="400"
}
```

La métrica sigue siendo:

```text
http_requests_total
```

pero Prometheus guarda una serie diferente para cada combinación de labels.

---

# 5. Filtrar por labels

Podemos filtrar las series usando `{}`.

Ejemplo:

```promql
http_requests_total{status="200"}
```

Significa:

```text
mostrar solamente requests con status 200
```

Otro ejemplo:

```promql
http_requests_total{method="GET"}
```

Significa:

```text
mostrar solamente requests GET
```

Podemos combinar varios filtros:

```promql
http_requests_total{
    method="GET",
    status="200"
}
```

Esto devuelve solamente:

```text
GET + status 200
```

---

# 6. rate()

`rate()` es una de las funciones más importantes cuando trabajamos con Counters.

Ejemplo:

```promql
rate(http_requests_total[5m])
```

Un Counter nos dice:

```text
cuántas requests han ocurrido en total
```

Pero normalmente queremos saber:

```text
¿a qué velocidad están llegando las requests?
```

`rate()` calcula la velocidad promedio de crecimiento del Counter.

Por ejemplo:

```text
0.21
```

significa aproximadamente:

```text
0.21 requests por segundo
```

Para convertir aproximadamente a requests por minuto:

```text
0.21 × 60
≈ 12.6 requests/minuto
```

---

# 7. ¿Qué significa [5m]?

Cuando escribimos:

```promql
rate(http_requests_total[5m])
```

`[5m]` significa:

```text
usar los últimos 5 minutos de datos
```

Prometheus analiza cómo creció el Counter durante ese período.

Podemos utilizar otras ventanas:

```text
[1m]
[5m]
[10m]
[30m]
[1h]
```

Ejemplo:

```promql
rate(http_requests_total[1m])
```

Utiliza únicamente el último minuto.

Una ventana pequeña reacciona más rápidamente a los cambios.

Una ventana mayor produce resultados más estables.

---

# 8. Diferencia entre Counter y rate()

Counter:

```promql
http_requests_total
```

Responde:

```text
¿Cuántas requests han ocurrido?
```

Ejemplo:

```text
500 requests
```

`rate()`:

```promql
rate(http_requests_total[5m])
```

Responde:

```text
¿A qué velocidad está creciendo ese contador?
```

Ejemplo:

```text
2.3 requests/segundo
```

Modelo mental:

```text
Counter
↓
total acumulado

rate(Counter)
↓
velocidad por segundo
```

---

# 9. sum()

`sum()` permite sumar diferentes series.

Ejemplo:

```promql
sum(
    rate(http_requests_total[5m])
)
```

Esto ignora las divisiones por:

```text
route
method
status
instance
job
```

y devuelve el tráfico total.

Ejemplo:

```text
0.45
```

significa:

```text
el servicio está recibiendo aproximadamente
0.45 requests por segundo
```

---

# 10. sum by()

`sum by()` permite sumar series pero conservar alguna dimensión.

Ejemplo:

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

Esto significa:

```text
calcula requests por segundo
↓
suma las series
↓
pero mantenlas separadas por route
```

Resultado conceptual:

```text
/api/v1/customers        0.15
/api/v1/customers/:id    0.05
/metrics                 0.20
```

Esto responde:

```text
¿Qué endpoints tienen más tráfico?
```

---

# 11. Agrupar por status

Podemos agrupar por código HTTP:

```promql
sum by (status) (
    rate(http_requests_total[5m])
)
```

Resultado:

```text
200 → 0.21 req/s
400 → 0.02 req/s
500 → 0.01 req/s
```

Esto responde:

```text
¿Qué tipos de respuestas está generando mi API?
```

---

# 12. Agrupar por route y status

Podemos conservar varias labels:

```promql
sum by (route, status) (
    rate(http_requests_total[5m])
)
```

Resultado conceptual:

```text
/api/v1/customers        200    0.15
/api/v1/customers/:id    400    0.02
/metrics                 200    0.21
```

Esto responde:

```text
¿Qué ruta está devolviendo qué status
y a qué velocidad?
```

---

# 13. Filtrar errores

Podemos buscar solamente respuestas 4xx y 5xx.

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"4..|5.."
        }[5m]
    )
)
```

Esto devuelve únicamente errores HTTP.

Ejemplos:

```text
400
401
403
404

500
502
503
```

---

# 14. Diferencia entre = y =~

Comparación exacta:

```promql
status="500"
```

Significa:

```text
solamente status 500
```

Regex:

```promql
status=~"5.."
```

Significa:

```text
cualquier código que empiece con 5
```

Ejemplos:

```text
500
501
502
503
504
```

La expresión:

```text
4..|5..
```

significa:

```text
cualquier 4xx
O
cualquier 5xx
```

El símbolo:

```text
|
```

significa:

```text
OR
```

---

# 15. Leer una query de adentro hacia afuera

Ejemplo:

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

Se puede leer así.

Primero:

```promql
http_requests_total
```

Tenemos el Counter.

Después:

```promql
rate(http_requests_total[5m])
```

Calculamos cómo creció durante los últimos 5 minutos.

Después:

```promql
sum(...)
```

Sumamos series.

Finalmente:

```promql
by (route)
```

Conservamos cada endpoint separado.

Resultado:

```text
requests por segundo agrupadas por ruta
```

---

# 16. Métrica up

Prometheus genera automáticamente una métrica importante:

```promql
up
```

Sirve para saber si Prometheus está pudiendo hacer scraping de un target.

Ejemplo:

```text
up{job="customers-service"} 1
```

Significa:

```text
Prometheus puede acceder correctamente
al endpoint /metrics de Customer Service
```

Si devuelve:

```text
0
```

significa:

```text
Prometheus no pudo hacer scraping
```

Por ejemplo:

```promql
up{job="customers-service"}
```

Resultado:

```text
1 = disponible
0 = no disponible
```

Esto no necesariamente significa que toda la aplicación esté funcionando correctamente.

Significa principalmente:

```text
Prometheus puede o no puede acceder al target
```

---

# 17. Histogram: http_request_duration_seconds

Customer Service también tiene:

```promql
http_request_duration_seconds
```

Esta métrica es un Histogram.

Sirve para medir:

```text
distribuciones de tiempos
```

En este caso:

```text
latencia HTTP
```

Cuando definimos un Histogram, Prometheus expone varias métricas relacionadas:

```text
http_request_duration_seconds_bucket

http_request_duration_seconds_sum

http_request_duration_seconds_count
```

---

# 18. _count

Ejemplo:

```promql
http_request_duration_seconds_count
```

Representa:

```text
cantidad total de requests medidas
por el Histogram
```

Ejemplo:

```text
16
```

significa:

```text
16 requests fueron medidas
```

---

# 19. _sum

Ejemplo:

```promql
http_request_duration_seconds_sum
```

Representa:

```text
suma total de las duraciones
```

Ejemplo:

```text
0.094 segundos
```

Si hubo:

```text
16 requests
```

podemos sacar promedio:

```text
0.094 / 16
≈ 0.0059 segundos
≈ 5.9 ms
```

---

# 20. Latencia promedio

Podemos calcular la latencia media durante una ventana:

```promql
rate(http_request_duration_seconds_sum[5m])
/
rate(http_request_duration_seconds_count[5m])
```

Ejemplo de resultado:

```text
0.025
```

Como la métrica está en segundos:

```text
0.025 segundos
=
25 ms
```

Esto responde:

```text
¿Cuánto están tardando aproximadamente
las requests en promedio?
```

---

# 21. Buckets

Nuestro Histogram puede tener buckets como:

```text
0.05
0.1
0.3
0.5
1
2
5
```

Significan:

```text
<= 50 ms
<= 100 ms
<= 300 ms
<= 500 ms
<= 1 segundo
<= 2 segundos
<= 5 segundos
```

Prometheus también agrega:

```text
+Inf
```

que significa:

```text
todas las observaciones
sin importar cuánto tardaron
```

---

# 22. Los buckets son acumulativos

Supongamos que una request tardó:

```text
0.22 segundos
```

Eso son:

```text
220 ms
```

Entonces cuenta dentro de:

```text
<= 0.3
<= 0.5
<= 1
<= 2
<= 5
<= +Inf
```

Pero no cuenta dentro de:

```text
<= 0.05
<= 0.1
```

Por eso los buckets del Histogram son acumulativos.

---

# 23. P95

P95 significa:

```text
percentil 95
```

Conceptualmente:

```text
95% de las requests tardaron
ese tiempo o menos
```

Ejemplo:

```text
P95 = 0.300 segundos
```

Significa:

```text
95% de requests <= 300 ms

aproximadamente 5% de requests > 300 ms
```

Esto suele ser más útil que mirar únicamente un promedio.

---

# 24. Query P95

Podemos calcular P95 mediante:

```promql
histogram_quantile(
    0.95,
    sum by (le) (
        rate(http_request_duration_seconds_bucket[5m])
    )
)
```

Por ahora no es necesario memorizar esta query.

Lo importante es entender:

```text
histogram_quantile()
↓
calcula percentiles utilizando buckets
```

---

# 25. Métricas técnicas y métricas de negocio

No todas las métricas representan lo mismo.

## Métricas técnicas

Ejemplos:

```text
http_requests_total

http_request_duration_seconds

CPU

RAM

heap

event loop

GC
```

Sirven para observar:

```text
cómo está funcionando técnicamente
el servicio
```

## Métricas de negocio

Ejemplos futuros:

```text
customer_created_total

outbox_events_published_total

outbox_events_failed_total
```

Sirven para observar:

```text
qué está haciendo funcionalmente
el sistema
```

---

# 26. Ejemplo de observabilidad con métricas de negocio

Supongamos:

```text
http_requests_total
↑

customer_created_total
↑

outbox_events_published_total
NO aumenta
```

Eso podría indicar:

```text
La API recibe requests.

Los customers se crean.

Pero el Outbox dejó de publicar eventos.
```

Las métricas permiten detectar ese tipo de comportamiento rápidamente.

---

# 27. Cardinalidad

Este es un concepto importante en Prometheus.

Cada combinación distinta de labels genera una serie temporal.

Esto está bien:

```text
route="/api/v1/customers/:id"
```

Esto es peligroso:

```text
route="/api/v1/customers/1"
route="/api/v1/customers/2"
route="/api/v1/customers/3"
route="/api/v1/customers/4"
...
```

Porque cada ID podría crear una serie distinta.

---

# 28. Buenos labels

Ejemplos:

```text
method

route

status

service

provider

channel
```

Tienen una cantidad limitada de posibles valores.

---

# 29. Malos labels

Evitar cosas como:

```text
customer_id

event_id

request_id

email

UUID

timestamp individual
```

Porque pueden tener miles o millones de valores.

Estos datos son mejores para:

```text
logs
```

o:

```text
tracing
```

---

# 30. Ruta parametrizada

Para Prometheus queremos guardar:

```text
/api/v1/customers/:id
```

No:

```text
/api/v1/customers/20
```

Ni:

```text
/api/v1/customers/21
```

Ni:

```text
/api/v1/customers/999
```

Así todas pertenecen a la misma serie:

```text
route="/api/v1/customers/:id"
```

---

# 31. Métricas default de Node.js

Con:

```ts
client.collectDefaultMetrics();
```

prom-client genera métricas automáticamente.

Entre ellas podemos encontrar:

```text
CPU

memoria

heap

Event Loop

Garbage Collector

active handles

active resources

versión de Node
```

Estas métricas sirven para observar el comportamiento del proceso Node.js.

---

# 32. Event Loop

Una métrica importante puede ser:

```text
nodejs_eventloop_lag_seconds
```

Mide cuánto se está retrasando el Event Loop.

Un Event Loop constantemente bloqueado puede indicar:

```text
operaciones CPU intensivas

código síncrono pesado

bloqueos

sobrecarga del proceso
```

---

# 33. Memoria

Prometheus también puede exponer métricas como:

```text
process_resident_memory_bytes

nodejs_heap_size_used_bytes

nodejs_heap_size_total_bytes
```

Permiten observar:

```text
uso de memoria del proceso

heap usado

heap total
```

Esto puede ayudar a detectar:

```text
crecimiento extraño de memoria

memory leaks

presión sobre el heap
```

---

# 34. Garbage Collector

Una métrica como:

```text
nodejs_gc_duration_seconds
```

permite observar cuánto tiempo está gastando Node.js en Garbage Collection.

Un comportamiento anormal del GC puede ser una señal de:

```text
mucha presión de memoria

muchas asignaciones

heap creciendo demasiado
```

---

# 35. Grafana

Grafana no reemplaza Prometheus.

Grafana normalmente:

```text
consulta Prometheus
```

La arquitectura es:

```text
Customer Service
      ↓
/metrics
      ↓
Prometheus
      ↓
PromQL
      ↓
Grafana
```

Prometheus:

```text
recolecta y almacena
```

Grafana:

```text
consulta y visualiza
```

---

# 36. Grafana Explore

Para practicar PromQL:

```text
Grafana
↓
Explore
↓
Prometheus
↓
escribir query
↓
Run query
```

Explore es útil antes de crear dashboards.

Puedes probar:

```promql
http_requests_total
```

Después:

```promql
rate(http_requests_total[5m])
```

Después:

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

---

# 37. Dashboard

Un Dashboard contiene Panels.

Ejemplo:

```text
STREAM CRM DASHBOARD

┌─────────────────────────┐
│ Customer Service        │
│           UP            │
└─────────────────────────┘

┌─────────────────────────┐
│ Requests / second       │
│                         │
│      gráfica            │
└─────────────────────────┘

┌─────────────────────────┐
│ Error rate              │
│                         │
│      gráfica            │
└─────────────────────────┘

┌─────────────────────────┐
│ P95 latency             │
│                         │
│      gráfica            │
└─────────────────────────┘
```

---

# 38. Panel: Service UP

Query:

```promql
up{job="customers-service"}
```

Visualización recomendada:

```text
Stat
```

Resultado:

```text
1
```

significa:

```text
Prometheus puede hacer scraping
```

Resultado:

```text
0
```

significa:

```text
Prometheus no puede hacer scraping
```

---

# 39. Panel: Requests por segundo

Query:

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

Visualización:

```text
Time series
```

Esto permite ver cómo cambia el tráfico de cada endpoint con el tiempo.

---

# 40. Panel: Error rate

Query:

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"4..|5.."
        }[5m]
    )
)
```

Visualización:

```text
Time series
```

Esto permite detectar:

```text
qué rutas están fallando

qué status están devolviendo

a qué velocidad están ocurriendo los errores
```

---

# 41. Panel: P95 latency

Query:

```promql
histogram_quantile(
    0.95,
    sum by (le) (
        rate(http_request_duration_seconds_bucket[5m])
    )
)
```

Visualización:

```text
Time series
```

Esto muestra cómo cambia el P95 de latencia a través del tiempo.

---

# 42. Prometheus scrapea /metrics

Prometheus normalmente trabaja con un modelo pull.

Eso significa:

```text
Prometheus
↓
GET /metrics
↓
Customer Service
```

La aplicación no necesita enviar continuamente métricas a Prometheus.

Prometheus va periódicamente a buscarlas.

---

# 43. ¿Por qué /metrics tiene tantas requests?

Prometheus llama automáticamente:

```text
GET /metrics
```

cada cierto intervalo de scraping.

Por eso podemos ver:

```text
route="/metrics"
```

con muchas requests.

No significa necesariamente que un usuario esté entrando manualmente.

Es Prometheus recolectando métricas.

---

# 44. Series temporales

Prometheus no guarda simplemente:

```text
http_requests_total = 100
```

Conceptualmente guarda algo parecido a:

```text
22:00 → 100

22:01 → 110

22:02 → 125

22:03 → 150
```

Eso permite estudiar cómo cambian las métricas con el tiempo.

Por eso se llama:

```text
Time Series Database
```

---

# 45. Logs vs Métricas

Logs:

```text
¿Qué ocurrió exactamente?
```

Ejemplo:

```text
event_id=ABC

SMS delivery failed

provider=Vonage

status=401
```

Métricas:

```text
¿Cuánto está ocurriendo?
```

Ejemplo:

```text
SMS failures = 15/min
```

Juntas permiten:

```text
Grafana
↓
detectar problema

Kibana
↓
investigar problema concreto
```

---

# 46. Tracing

Tracing responde otra pregunta:

```text
¿Por dónde pasó una operación?
```

Ejemplo:

```text
POST /customers
      ↓
Customer Service
      ↓
PostgreSQL
      ↓
Outbox
      ↓
RabbitMQ
      ↓
Notification Service
      ↓
SMS Provider
```

Cada parte puede formar un Span.

Todos los Spans forman un Trace.

---

# 47. Los tres pilares de observabilidad

```text
LOGS

¿Qué ocurrió?
```

```text
METRICS

¿Cuánto está ocurriendo?
```

```text
TRACES

¿Por dónde pasó?
```

---

# 48. Stack actual de Stream CRM

Logs:

```text
Node.js
↓
Winston
↓
Elasticsearch
↓
Kibana
```

Metrics:

```text
Node.js
↓
prom-client
↓
/metrics
↓
Prometheus
↓
Grafana
```

Tracing futuro:

```text
Node.js
↓
OpenTelemetry
↓
Tracing Backend
↓
Grafana / Jaeger / Tempo
```

---

# 49. Queries fundamentales

## Ver todas las series del Counter

```promql
http_requests_total
```

---

## Requests por segundo

```promql
rate(http_requests_total[5m])
```

---

## Tráfico total

```promql
sum(
    rate(http_requests_total[5m])
)
```

---

## Requests por route

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

---

## Requests por status

```promql
sum by (status) (
    rate(http_requests_total[5m])
)
```

---

## Requests por route y status

```promql
sum by (route, status) (
    rate(http_requests_total[5m])
)
```

---

## Solo status 200

```promql
rate(
    http_requests_total{
        status="200"
    }[5m]
)
```

---

## Solo errores 4xx y 5xx

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"4..|5.."
        }[5m]
    )
)
```

---

## Solo errores 5xx

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"5.."
        }[5m]
    )
)
```

---

## Estado de Customer Service

```promql
up{job="customers-service"}
```

---

## Latencia media

```promql
rate(http_request_duration_seconds_sum[5m])
/
rate(http_request_duration_seconds_count[5m])
```

---

## P95 de latencia

```promql
histogram_quantile(
    0.95,
    sum by (le) (
        rate(http_request_duration_seconds_bucket[5m])
    )
)
```

---

# 50. Cómo interpretar un resultado de rate()

Si Prometheus devuelve:

```text
0.0203
```

significa:

```text
aproximadamente 0.0203 eventos por segundo
```

Podemos convertir aproximadamente a minuto:

```text
0.0203 × 60
≈ 1.218 eventos/minuto
```

Pero debemos recordar:

```text
rate()
calcula una tasa utilizando las muestras
dentro de la ventana seleccionada
```

No es simplemente:

```text
contador / tiempo
```

Es una estimación de la velocidad de crecimiento del Counter.

---

# 51. Regla mental para Counter

Cuando veas:

```text
*_total
```

muy probablemente estás ante un Counter.

Ejemplos:

```text
http_requests_total

customer_created_total

outbox_events_published_total

outbox_events_failed_total
```

Normalmente para analizar su velocidad utilizaremos:

```promql
rate(...)
```

---

# 52. Regla mental para Gauge

Un Gauge puede subir y bajar.

Ejemplos futuros:

```text
pending_deliveries

active_connections

queue_depth
```

Ejemplo:

```text
10
15
8
20
4
```

No utilizamos necesariamente `rate()` como primera opción.

Podemos consultar directamente:

```promql
pending_deliveries
```

---

# 53. Regla mental para Histogram

Un Histogram sirve especialmente para:

```text
duraciones

latencias

tamaños

distribuciones
```

Ejemplo:

```text
http_request_duration_seconds
```

Genera:

```text
_bucket
_sum
_count
```

Y permite calcular:

```text
promedio

P95

P99
```

---

# 54. Qué aprender primero

No necesitamos memorizar todo PromQL.

Primero dominar:

```text
metric_name

{}

rate()

sum()

by()
```

Después:

```text
histogram_quantile()
```

Con esas pocas piezas podemos construir dashboards bastante útiles.

---

# 55. Modelo mental final de PromQL

```text
Métrica
↓
Filtro {}
↓
rate()
↓
sum()
↓
by(labels)
↓
resultado
↓
Grafana
```

Ejemplo:

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"4..|5.."
        }[5m]
    )
)
```

Se puede leer:

```text
Toma http_requests_total

↓

Quédate con errores 4xx y 5xx

↓

Calcula su velocidad usando 5 minutos

↓

Suma series

↓

Pero mantenlas separadas por route y status
```

Resultado:

```text
tasa de errores por endpoint y código HTTP
```

---

# 56. Cheatsheet rápido

## Counter

```promql
http_requests_total
```

## Requests por segundo

```promql
rate(http_requests_total[5m])
```

## Total req/s

```promql
sum(rate(http_requests_total[5m]))
```

## Req/s por endpoint

```promql
sum by (route) (
    rate(http_requests_total[5m])
)
```

## Req/s por status

```promql
sum by (status) (
    rate(http_requests_total[5m])
)
```

## Req/s por endpoint + status

```promql
sum by (route, status) (
    rate(http_requests_total[5m])
)
```

## Errores

```promql
sum by (route, status) (
    rate(
        http_requests_total{
            status=~"4..|5.."
        }[5m]
    )
)
```

## Servicio UP

```promql
up{job="customers-service"}
```

## Latencia media

```promql
rate(http_request_duration_seconds_sum[5m])
/
rate(http_request_duration_seconds_count[5m])
```

## P95

```promql
histogram_quantile(
    0.95,
    sum by (le) (
        rate(http_request_duration_seconds_bucket[5m])
    )
)
```

---

# 57. Resumen final

Prometheus trabaja con métricas y series temporales.

Un Counter:

```text
http_requests_total
```

responde:

```text
¿Cuántas veces ocurrió?
```

`rate()` responde:

```text
¿A qué velocidad está ocurriendo?
```

`sum()` responde:

```text
¿Cuánto hay en total?
```

`by()` responde:

```text
¿Cómo quiero agruparlo?
```

Las labels permiten dividir una métrica por dimensiones:

```text
method
route
status
service
```

Los Histograms permiten analizar distribuciones:

```text
latencia
P95
P99
```

Grafana consulta Prometheus y visualiza esas métricas.

Modelo mental:

```text
Aplicación
↓
/metrics
↓
Prometheus
↓
PromQL
↓
Grafana
```

Y el modelo general de observabilidad:

```text
Logs
→ ¿Qué ocurrió?

Metrics
→ ¿Cuánto está ocurriendo?

Tracing
→ ¿Por dónde pasó?
```

Para empezar no necesito aprender todo PromQL.

Necesito dominar principalmente:

```text
metric_name

{}

rate()

sum()

by()
```

y después avanzar a:

```text
histogram_quantile()
```

Con eso ya puedo construir dashboards útiles para Stream CRM.