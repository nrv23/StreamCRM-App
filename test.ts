// ======================================================
// 1. CONTRATO DEL EVENTO QUE VIENE DE RABBITMQ
// ======================================================

interface IntegrationEvent<TPayload = unknown> {
    eventId: string;
    eventName: string;
    payload: TPayload;
}


// ======================================================
// 2. RESULTADO DEL PROCESAMIENTO
// ======================================================

type ProcessEventResult =
    | { status: "processed" }
    | { status: "duplicated" };


// ======================================================
// 3. CONTRATO COMÚN PARA TODOS LOS HANDLERS
// ======================================================

interface IntegrationEventHandler {
    handle(event: IntegrationEvent): Promise<void>;
}


// ======================================================
// 4. REPOSITORIO DE NOTIFICACIONES
// ======================================================

interface NotificationRepository {
    save(notification: {
        eventId: string;
        recipient: string;
        message: string;
    }): Promise<void>;
}


// ======================================================
// 5. IMPLEMENTACIÓN SIMPLE DEL REPOSITORIO
//
// En tu proyecto real esta clase guardaría en PostgreSQL.
// Aquí usamos un array para entender el flujo.
// ======================================================

class InMemoryNotificationRepository
    implements NotificationRepository {
    private readonly notifications: Array<{
        eventId: string;
        recipient: string;
        message: string;
    }> = [];

    public async save(notification: {
        eventId: string;
        recipient: string;
        message: string;
    }): Promise<void> {
        this.notifications.push(notification);

        console.log(
            "[NotificationRepository] Notificación guardada:",
            notification,
        );
    }

    public getAll() {
        return this.notifications;
    }
}


// ======================================================
// 6. REPOSITORIO DE EVENTOS PROCESADOS
//
// Representa tu tabla processed_events.
// ======================================================

interface ProcessedEventRepository {
    exists(eventId: string): Promise<boolean>;

    save(event: {
        eventId: string;
        eventName: string;
    }): Promise<void>;
}


class InMemoryProcessedEventRepository
    implements ProcessedEventRepository {
    private readonly processedEvents = new Set<string>();

    public async exists(eventId: string): Promise<boolean> {
        return this.processedEvents.has(eventId);
    }

    public async save(event: {
        eventId: string;
        eventName: string;
    }): Promise<void> {
        this.processedEvents.add(event.eventId);

        console.log(
            `[ProcessedEventRepository] Evento registrado: ${event.eventName}`,
        );
    }
}


// ======================================================
// 7. PAYLOAD ESPECÍFICO DE customer.created
// ======================================================

interface CustomerCreatedPayload {
    customerId: number;
    email: string;
    name: string;
}


// ======================================================
// 8. HANDLER DE customer.created
//
// Esta clase sí sabe qué hacer cuando llega
// customer.created.
// ======================================================

class CustomerCreatedHandler
    implements IntegrationEventHandler {
    constructor(
        private readonly notificationRepository:
            NotificationRepository,
    ) { }

    public async handle(
        event: IntegrationEvent,
    ): Promise<void> {
        const payload =
            event.payload as CustomerCreatedPayload;

        console.log(
            "[CustomerCreatedHandler] Procesando customer.created",
        );

        await this.notificationRepository.save({
            eventId: event.eventId,
            recipient: payload.email,
            message: `Bienvenido ${payload.name}`,
        });
    }
}


// ======================================================
// 9. OTRO HANDLER PARA MOSTRAR QUE PUEDEN EXISTIR VARIOS
// ======================================================

interface CustomerStatusChangedPayload {
    customerId: number;
    email: string;
    previousStatus: string;
    newStatus: string;
}


class CustomerStatusChangedHandler
    implements IntegrationEventHandler {
    constructor(
        private readonly notificationRepository:
            NotificationRepository,
    ) { }

    public async handle(
        event: IntegrationEvent,
    ): Promise<void> {
        const payload =
            event.payload as CustomerStatusChangedPayload;

        console.log(
            "[CustomerStatusChangedHandler] Procesando customer.status.changed",
        );

        await this.notificationRepository.save({
            eventId: event.eventId,
            recipient: payload.email,
            message:
                `Estado cambiado de ` +
                `${payload.previousStatus} a ${payload.newStatus}`,
        });
    }
}


// ======================================================
// 10. DISPATCHER
//
// El Dispatcher recibe el evento y busca cuál handler
// debe procesarlo.
//
// No guarda clases.
// Guarda objetos ya construidos.
// ======================================================

class EventDispatcher {
    constructor(
        private readonly handlers:
            Map<string, IntegrationEventHandler>,
    ) { }

    public async dispatch(
        event: IntegrationEvent,
    ): Promise<void> {
        console.log(
            `[Dispatcher] Buscando handler para: ${event.eventName}`,
        );

        const handler =
            this.handlers.get(event.eventName);

        if (!handler) {
            throw new Error(
                `No existe un handler para ${event.eventName}`,
            );
        }

        console.log(
            `[Dispatcher] Handler encontrado: ${handler.constructor.name}`,
        );

        await handler.handle(event);
    }
}


// ======================================================
// 11. CASO DE USO PRINCIPAL
//
// Controla:
// - Idempotencia.
// - Ejecución del handler.
// - Registro en processed_events.
//
// No conoce RabbitMQ.
// No hace ack ni nack.
// ======================================================

class ProcessIntegrationEvent {
    constructor(
        private readonly processedEventRepository:
            ProcessedEventRepository,

        private readonly dispatcher:
            EventDispatcher,
    ) { }

    public async execute(
        event: IntegrationEvent,
    ): Promise<ProcessEventResult> {
        console.log(
            `[ProcessIntegrationEvent] Evento recibido: ${event.eventName}`,
        );

        const alreadyProcessed =
            await this.processedEventRepository.exists(
                event.eventId,
            );

        if (alreadyProcessed) {
            console.log(
                "[ProcessIntegrationEvent] Evento duplicado",
            );

            return {
                status: "duplicated",
            };
        }

        // Aquí el dispatcher busca el handler correcto.
        await this.dispatcher.dispatch(event);

        // Solo se registra después de procesarlo correctamente.
        await this.processedEventRepository.save({
            eventId: event.eventId,
            eventName: event.eventName,
        });

        return {
            status: "processed",
        };
    }
}


// ======================================================
// 12. CONSUMER
//
// Este consumer simula RabbitMQ.
//
// Su responsabilidad es:
// - Recibir el mensaje.
// - Convertir JSON a objeto.
// - Llamar al caso de uso.
// - Hacer ACK o NACK.
// ======================================================

class RabbitMqConsumer {
    constructor(
        private readonly processIntegrationEvent:
            ProcessIntegrationEvent,
    ) { }

    public async receive(
        rawMessage: string,
    ): Promise<void> {
        console.log("\n[Consumer] Mensaje recibido");

        try {
            const event =
                JSON.parse(rawMessage) as IntegrationEvent;

            const result =
                await this.processIntegrationEvent.execute(
                    event,
                );

            switch (result.status) {
                case "processed":
                    console.log(
                        "[Consumer] ACK: evento procesado",
                    );
                    break;

                case "duplicated":
                    console.log(
                        "[Consumer] ACK: evento duplicado",
                    );
                    break;
            }
        } catch (error) {
            console.error(
                "[Consumer] NACK: error procesando mensaje",
                error,
            );
        }
    }
}


// ======================================================
// 13. COMPOSITION ROOT / BOOTSTRAP
//
// Aquí se construyen todos los objetos.
// Este código se ejecuta una vez cuando arranca la app.
// ======================================================

async function bootstrap(): Promise<void> {
    // Repositorios
    const notificationRepository =
        new InMemoryNotificationRepository();

    const processedEventRepository =
        new InMemoryProcessedEventRepository();

    // Handlers ya construidos con sus dependencias
    const customerCreatedHandler =
        new CustomerCreatedHandler(
            notificationRepository,
        );

    const customerStatusChangedHandler =
        new CustomerStatusChangedHandler(
            notificationRepository,
        );

    // Mapa que relaciona eventName con handler
    const handlers =
        new Map<string, IntegrationEventHandler>();

    handlers.set(
        "customer.created",
        customerCreatedHandler,
    );

    handlers.set(
        "customer.status.changed",
        customerStatusChangedHandler,
    );

    // Dispatcher
    const dispatcher =
        new EventDispatcher(handlers);

    // Caso de uso
    const processIntegrationEvent =
        new ProcessIntegrationEvent(
            processedEventRepository,
            dispatcher,
        );

    // Consumer
    const consumer =
        new RabbitMqConsumer(
            processIntegrationEvent,
        );

    // Simulamos un mensaje enviado por RabbitMQ
    const message = JSON.stringify({
        eventId: "c4e62a04-abc1-4d21-9911-123456789000",
        eventName: "customer.created",
        payload: {
            customerId: 15,
            email: "juan@test.com",
            name: "Juan",
        },
    });

    // Primera entrega
    await consumer.receive(message);

    // RabbitMQ vuelve a entregar el mismo mensaje.
    // processed_events evita procesarlo dos veces.
    await consumer.receive(message);
}

bootstrap().catch(console.error);