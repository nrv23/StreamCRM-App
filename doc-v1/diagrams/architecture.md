# Architecture Diagrams

## General System Architecture

```text
                              ┌────────────────────┐
                              │   React Frontend    │
                              │ Dashboard / CRM UI  │
                              └─────────┬──────────┘
                                        │
                         HTTP REST      │      WebSocket
                                        │
                              ┌─────────▼──────────┐
                              │   API Gateway/API   │
                              │ Express + TS        │
                              └─────────┬──────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
┌────────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
│   PostgreSQL    │            │      Redis      │            │    RabbitMQ     │
│ Main Database   │            │ Cache/PubSub    │            │ Event Broker    │
└─────────────────┘            └────────┬────────┘            └────────┬────────┘
                                        │                              │
                                        │                              │
                              ┌─────────▼──────────┐          ┌────────▼────────┐
                              │ Notification Svc   │          │ Worker Services │
                              │ WebSocket / Email  │          │ Jobs / Streams  │
                              └────────────────────┘          └─────────────────┘
```

## Customer Import Flow

```text
CSV Upload
   │
   ▼
Readable Stream
   │
   ▼
CSV Parser Transform
   │
   ▼
Validation Transform
   │
   ▼
Batch Publisher
   │
   ▼
RabbitMQ Queue
   │
   ▼
Import Worker
   │
   ▼
PostgreSQL Insert
   │
   ▼
Progress Event
   │
   ▼
Redis PubSub
   │
   ▼
WebSocket Dashboard
```
