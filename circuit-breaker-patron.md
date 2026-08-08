# Patrón Circuit Breaker (Interruptor de Circuito)

El **Circuit Breaker** es un patrón de diseño utilizado en arquitecturas distribuidas, microservicios e integraciones con APIs externas para mejorar la resiliencia del sistema y evitar fallos en cascada.

---

## 💡 El Problema

Cuando un servicio externo o base de datos falla o responde muy lento (timeouts):
* Las peticiones en el cliente se acumulan esperando respuesta.
* Se agotan hilos, memoria o sockets en el servidor.
* **Resultado:** Todo el sistema colapsa por culpa de una sola dependencia fallida.

---

## ⚙️ Máquina de Estados

       ┌───────────┐
       │           │ (Muchos errores)
       │  CERRADO  ├─────────────┐
       │  (Closed) │             │
       └─────▲─────┘             ▼
             │            ┌─────────────┐
             │            │             │
(Éxito en    │            │   ABIERTO   │
 las pruebas)│            │   (Open)    │
             │            └──────┬──────┘
       ┌─────┴─────┐             │
       │   SEMI-   │             │ (Pasa el tiempo
       │  ABIERTO  │◄────────────┘  de cooldown)
       │(Half-Open)│
       └───────────┘

### 1. 🟢 Cerrado (Closed) — *Estado Normal*
* El tráfico fluye normalmente hacia el servicio externo.
* Se monitorea la tasa de errores en una ventana de tiempo.
* **Transición:** Si supera el umbral de fallos, pasa a **Abierto**.

### 2. 🔴 Abierto (Open) — *Fallo Rápido (Fail Fast)*
* **Bloquea** todas las llamadas entrantes de inmediato.
* Responde al instante con error o *fallback* sin llamar al servicio remoto.
* Permite que el servicio remoto se recupere sin sobrecargarlo.
* Permanece en este estado durante un tiempo definido (*cooldown timer*).
* **Transición:** Al expirar el temporizador, pasa a **Semi-Abierto**.

### 3. 🟡 Semi-Abierto (Half-Open) — *Modo Prueba*
* Deja pasar **solo una o dos peticiones piloto** de prueba.
* **Transición si tienen éxito:** Pasa a **Cerrado** y reinicia contadores.
* **Transición si fallan:** Vuelve inmediatamente a **Abierto** y reinicia el *cooldown*.

---

## 🎯 Beneficios Principales

* **Fail Fast:** Respuestas en milisegundos cuando hay degradación del servicio.
* **Autocuración:** El sistema restablece el flujo normal automáticamente cuando la dependencia se recupera.
* **Protección de Recursos:** Evita agotar *pools* de conexiones, memoria o *threads*.

---

## 🛠️ Bibliotecas Populares

* **JavaScript / Node.js:** Opossum
* **Go:** Gobreaker, CockroachDB Circuitbreaker
* **Java:** Resilience4j
* **.NET:** Polly