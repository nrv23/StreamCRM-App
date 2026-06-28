# 01 - Introduction

## ¿Qué es StreamCRM?

StreamCRM es una plataforma CRM diseñada para gestionar clientes, tickets, campañas, importaciones masivas, reportes empresariales y métricas en tiempo real.

A diferencia de un CRM tradicional basado únicamente en CRUDs, StreamCRM está diseñado para simular problemas reales de sistemas empresariales modernos:

- Carga masiva de clientes desde archivos CSV.
- Procesamiento asíncrono de campañas.
- Generación de reportes grandes sin consumir grandes cantidades de memoria.
- Dashboard en tiempo real.
- Auditoría de cambios.
- Manejo de jobs fallidos.
- Reintentos automáticos.
- Dead Letter Queue.
- Cache distribuido.
- Arquitectura orientada a eventos.

## Propósito técnico

El propósito de este proyecto es demostrar habilidades avanzadas de ingeniería backend usando tecnologías modernas y conceptos de sistemas distribuidos.

El proyecto busca mostrar que el desarrollador entiende:

- Diseño modular.
- Separación de responsabilidades.
- Procesamiento eficiente de datos.
- Comunicación asíncrona entre servicios.
- Consistencia eventual.
- Patrones de resiliencia.
- Diseño de bases de datos relacionales.
- Control de memoria en Node.js usando streams.
- Arquitectura preparada para escalar.

## Dominio del negocio

El sistema representa un CRM para equipos de atención al cliente y campañas.

Usuarios principales:

- Administradores.
- Supervisores.
- Agentes de atención.
- Servicios internos.
- Workers de procesamiento.

## Casos de uso principales

1. Un administrador importa 100 mil clientes desde un CSV.
2. El sistema procesa el archivo usando streams y workers.
3. Los clientes válidos se guardan en PostgreSQL.
4. Los registros inválidos se registran como errores de importación.
5. El dashboard muestra el progreso en tiempo real.
6. Un supervisor crea una campaña para clientes segmentados.
7. RabbitMQ distribuye los jobs a workers.
8. El sistema publica eventos del progreso.
9. Los agentes atienden tickets asociados a clientes.
10. Los reportes masivos se generan usando cursores y streams.

## Qué NO es este proyecto

StreamCRM no busca ser:

- Un CRUD básico.
- Un clon completo de Salesforce.
- Una aplicación SaaS lista para producción real.
- Un sistema enorme imposible de terminar.

StreamCRM sí busca ser:

- Un proyecto de portafolio serio.
- Una demostración de arquitectura backend.
- Un sistema con features avanzadas pero alcance controlado.
- Una base para hablar con autoridad en entrevistas técnicas.
