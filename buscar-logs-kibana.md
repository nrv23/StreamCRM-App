BÚSQUEDA DE LOGS EN KIBANA CON ES|QL
=====================================

ES|QL permite consultar, filtrar, ordenar y analizar los documentos almacenados
en Elasticsearch.

Su sintaxis se basa en comandos conectados mediante el operador pipe:

|

Cada comando recibe el resultado del comando anterior.


1. FROM
-------

Indica desde qué índice o conjunto de índices queremos leer.

Ejemplo:

FROM app-logs*

El * funciona como wildcard.

Por ejemplo, app-logs* incluye índices como:

app-logs-customer-service-2026.08.12
app-logs-notification-service-2026.08.12
app-logs-auth-service-2026.08.12


2. WHERE
--------

Permite filtrar documentos.

Ejemplo:

FROM app-logs*
| WHERE fields.event == "customer.created"

Buscar por customer_id:

FROM app-logs*
| WHERE fields.customer_id == 76

Buscar por microservicio:

FROM app-logs*
| WHERE fields.service == "customer_service"


3. COMBINAR CONDICIONES
-----------------------

Se pueden utilizar AND y OR.

Ejemplo:

FROM app-logs*
| WHERE fields.service == "customer_service"
  AND fields.event == "customer.created"

Otro ejemplo:

FROM app-logs*
| WHERE fields.status_code >= 400
  AND fields.service == "customer_service"


4. SORT
-------

Permite ordenar los resultados.

Para mostrar primero los logs más recientes:

FROM app-logs*
| SORT @timestamp DESC

ASC  = orden ascendente
DESC = orden descendente


5. LIMIT
--------

Limita la cantidad de documentos devueltos.

Ejemplo:

FROM app-logs*
| SORT @timestamp DESC
| LIMIT 20

Esto devuelve los últimos 20 logs.


6. KEEP
-------

Permite mostrar únicamente los campos que nos interesan.

Ejemplo:

FROM app-logs*
| KEEP @timestamp,
       fields.service,
       fields.event,
       fields.customer_id,
       message

Esto resulta útil porque un documento de Elasticsearch puede contener muchos
campos que no necesitamos visualizar.


7. CONSULTA COMPLETA
--------------------

Ejemplo:

FROM app-logs*
| WHERE fields.service == "customer_service"
  AND fields.event == "customer.created"
| SORT @timestamp DESC
| KEEP @timestamp,
       fields.event,
       fields.event_id,
       fields.customer_id,
       fields.status_code,
       message
| LIMIT 50

Esta consulta significa:

- Buscar en todos los índices app-logs*
- Obtener solamente logs del customer_service
- Obtener solamente eventos customer.created
- Ordenarlos desde el más reciente
- Mostrar únicamente los campos importantes
- Devolver máximo 50 resultados


8. BUSCAR UN EVENT_ID
---------------------

FROM app-logs*
| WHERE fields.event_id == "UUID"

Esto es especialmente útil para seguir un evento específico.


9. BUSCAR ERRORES HTTP
----------------------

FROM app-logs*
| WHERE fields.service == "customer_service"
  AND fields.status_code >= 400
| SORT @timestamp DESC
| KEEP @timestamp,
       fields.route,
       fields.status_code,
       message


10. STATS
---------

STATS permite agregar y analizar logs.

Por ejemplo, contar eventos por tipo:

FROM app-logs*
| STATS total = COUNT(*) BY fields.event
| SORT total DESC

Ejemplo de resultado:

customer.created     120
customer.updated      85
customer.deleted      12


MODELO MENTAL DE ES|QL
======================

FROM
¿De dónde obtengo los documentos?

WHERE
¿Cuáles documentos quiero?

KEEP
¿Qué campos quiero visualizar?

SORT
¿En qué orden quiero los documentos?

LIMIT
¿Cuántos quiero devolver?

STATS
¿Quiero agrupar o calcular estadísticas?


COMPARACIÓN APROXIMADA CON SQL
==============================

SQL:

SELECT event, customer_id
FROM logs
WHERE service = 'customer_service'
ORDER BY created_at DESC
LIMIT 20;

ES|QL:

FROM app-logs*
| WHERE fields.service == "customer_service"
| SORT @timestamp DESC
| KEEP fields.event, fields.customer_id
| LIMIT 20


BÚSQUEDA POR FECHAS EN KIBANA CON ES|QL
========================================

En Elasticsearch normalmente los timestamps se guardan en UTC.

Ejemplo:

2026-08-12T19:00:00Z

La letra Z al final significa UTC.

Costa Rica está en UTC-6, así que:

19:00 UTC
=
13:00 Costa Rica


1. FILTRAR DESDE UNA FECHA/HORA
-------------------------------

Para buscar todos los logs posteriores a una fecha:

FROM app-logs*
| WHERE @timestamp >= TO_DATETIME("2026-08-12T19:00:00Z")
| SORT @timestamp DESC

Esto significa:

Buscar logs posteriores o iguales a:

2026-08-12 19:00 UTC

Que en Costa Rica sería:

2026-08-12 13:00


2. FILTRAR HASTA UNA FECHA/HORA
-------------------------------

FROM app-logs*
| WHERE @timestamp <= TO_DATETIME("2026-08-12T20:00:00Z")
| SORT @timestamp DESC

Esto devuelve logs anteriores o iguales a esa hora.


3. FILTRAR ENTRE DOS FECHAS
---------------------------

ES|QL no usa BETWEEN como SQL.

Se utilizan dos condiciones:

FROM app-logs*
| WHERE @timestamp >= TO_DATETIME("2026-08-12T19:00:00Z")
  AND @timestamp <= TO_DATETIME("2026-08-12T20:00:00Z")
| SORT @timestamp DESC

Esto equivale conceptualmente a:

WHERE timestamp BETWEEN fecha_inicio AND fecha_fin


4. COMBINAR FECHA CON OTROS FILTROS
-----------------------------------

Ejemplo:

FROM app-logs*
| WHERE service == "customer_service"
  AND event == "customer.created"
  AND @timestamp >= TO_DATETIME("2026-08-12T19:00:00Z")
| SORT @timestamp DESC

Esto busca:

- logs del customer_service
- evento customer.created
- posteriores a las 19:00 UTC


5. UTC VS HORA DE COSTA RICA
----------------------------

Costa Rica = UTC-6

Para convertir hora de Costa Rica a UTC:

sumar 6 horas

Ejemplos:

07:00 Costa Rica = 13:00 UTC
10:00 Costa Rica = 16:00 UTC
12:00 Costa Rica = 18:00 UTC
13:00 Costa Rica = 19:00 UTC
15:00 Costa Rica = 21:00 UTC

Para convertir UTC a Costa Rica:

restar 6 horas


6. EJEMPLO PRÁCTICO
-------------------

Quiero buscar logs creados después de la 1:00 PM hora de Costa Rica.

1:00 PM Costa Rica
=
13:00 Costa Rica

13:00 + 6 horas
=
19:00 UTC

Entonces:

FROM app-logs*
| WHERE @timestamp >= TO_DATETIME("2026-08-12T19:00:00Z")
| SORT @timestamp DESC


7. RANGO EXACTO
---------------

Buscar logs entre 1:00 PM y 2:00 PM hora Costa Rica:

13:00 CR = 19:00 UTC
14:00 CR = 20:00 UTC

Query:

FROM app-logs*
| WHERE @timestamp >= TO_DATETIME("2026-08-12T19:00:00Z")
  AND @timestamp < TO_DATETIME("2026-08-12T20:00:00Z")
| SORT @timestamp DESC

Usar < en la fecha final suele ser útil para definir rangos sin solapamientos.


8. IMPORTANTE SOBRE KIBANA
--------------------------

Aunque Elasticsearch almacene:

2026-08-12T19:05:00Z

Kibana puede mostrar:

13:05

porque Kibana convierte el timestamp UTC a la zona horaria local del navegador.

Ambos representan exactamente el mismo instante.


REGLA RÁPIDA
============

Si ves Z:

Z = UTC

Costa Rica → UTC:
sumar 6 horas

UTC → Costa Rica:
restar 6 horas

