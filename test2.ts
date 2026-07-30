// ======================================================
// application/contracts/event-handler.interface.ts
// ======================================================

export interface EventHandler<TEvent> {
    handle(event: TEvent): Promise<void>;
}


// ======================================================
// application/contracts/notification-sender.interface.ts
// ======================================================

export interface SendNotificationCommand {
    to: string;
    subject: string;
    html: string;
}

export interface INotificationSender {
    send(command: SendNotificationCommand): Promise<void>;
}


// ======================================================
// domain/entities/notification.entity.ts
// ======================================================

export interface NotificationProps {
    eventId: string;
    userId: number;
    title: string;
    message: string;
    type: string;
    status: "pending" | "sent" | "failed";
    metadata: Record<string, unknown>;
}

export class Notification {
    private constructor(
        public readonly eventId: string,
        public readonly userId: number,
        public readonly title: string,
        public readonly message: string,
        public readonly type: string,
        public readonly status: "pending" | "sent" | "failed",
        public readonly metadata: Record<string, unknown>,
        public readonly id?: number,
    ) { }

    static create(props: NotificationProps): Notification {
        return new Notification(
            props.eventId,
            props.userId,
            props.title,
            props.message,
            props.type,
            props.status,
            props.metadata,
        );
    }

    static restore(
        id: number,
        props: NotificationProps,
    ): Notification {
        return new Notification(
            props.eventId,
            props.userId,
            props.title,
            props.message,
            props.type,
            props.status,
            props.metadata,
            id,
        );
    }
}


// ======================================================
// application/repositories/notification-repository.interface.ts
// ======================================================

export interface INotificationRepository {
    save(notification: Notification): Promise<Notification>;
}


// ======================================================
// application/handlers/base-notification-event-handler.ts
// ======================================================

export abstract class BaseNotificationEventHandler<TEvent>
    implements EventHandler<TEvent> {
    constructor(
        protected readonly notificationRepository: INotificationRepository,
        protected readonly notificationSender: INotificationSender,
    ) { }

    /**
     * Template Method:
     * define el flujo común para todos los handlers.
     */
    async handle(event: TEvent): Promise<void> {
        // 1. Cada handler construye su notificación.
        const notification = this.createNotification(event);

        // 2. La clase base guarda la notificación.
        const savedNotification =
            await this.notificationRepository.save(notification);

        // 3. El handler decide si necesita ejecutar un envío.
        const sendCommand = this.createSendCommand(
            event,
            savedNotification,
        );

        // 4. Si retorna null, el evento no necesita correo.
        if (sendCommand === null) {
            return;
        }

        // 5. Si existe un comando, se envía la notificación.
        await this.notificationSender.send(sendCommand);
    }

    /**
     * Cada handler está obligado a construir
     * su propia entidad Notification.
     */
    protected abstract createNotification(
        event: TEvent,
    ): Notification;

    /**
     * Por defecto no se envía ningún correo.
     *
     * El handler que necesite correo sobrescribe este método
     * y retorna un SendNotificationCommand.
     */
    protected createSendCommand(
        _event: TEvent,
        _notification: Notification,
    ): SendNotificationCommand | null {
        return null;
    }
}


// ======================================================
// application/events/customer-created.event.ts
// ======================================================

export interface CustomerCreatedEvent {
    eventId: string;
    eventName: "customer.created";
    occurredAt: string;

    data: {
        customerId: number;
        userId: number;
        name: string;
        email: string;
        phone?: string;
    };
}


// ======================================================
// application/handlers/customer-created.handler.ts
// ======================================================

export class CustomerCreatedHandler
    extends BaseNotificationEventHandler<CustomerCreatedEvent> {
    /**
     * Construye la notificación que será guardada en PostgreSQL.
     */
    protected createNotification(
        event: CustomerCreatedEvent,
    ): Notification {
        return Notification.create({
            eventId: event.eventId,
            userId: event.data.userId,
            title: "Nuevo cliente creado",
            message: `El cliente ${event.data.name} fue creado correctamente.`,
            type: "customer.created",
            status: "pending",

            metadata: {
                customerId: event.data.customerId,
                customerName: event.data.name,
                email: event.data.email,
                phone: event.data.phone,
                eventName: event.eventName,
                occurredAt: event.occurredAt,
            },
        });
    }

    /**
     * Este handler sí necesita enviar correo,
     * por eso sobrescribe createSendCommand().
     */
    protected createSendCommand(
        event: CustomerCreatedEvent,
        notification: Notification,
    ): SendNotificationCommand {
        return {
            to: event.data.email,
            subject: notification.title,
            html: `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>${notification.title}</title>
          </head>

          <body>
            <h1>${notification.title}</h1>

            <p>
              El cliente
              <strong>${event.data.name}</strong>
              fue creado correctamente.
            </p>

            <p>
              Identificador del cliente:
              ${event.data.customerId}
            </p>
          </body>
        </html>
      `,
        };
    }
}


// ======================================================
// Otro handler que NO envía correo
// application/handlers/customer-tag-added.handler.ts
// ======================================================

export interface CustomerTagAddedEvent {
    eventId: string;
    eventName: "customer.tag-added";
    occurredAt: string;

    data: {
        customerId: number;
        userId: number;
        tagId: number;
        tagName: string;
    };
}

export class CustomerTagAddedHandler
    extends BaseNotificationEventHandler<CustomerTagAddedEvent> {
    protected createNotification(
        event: CustomerTagAddedEvent,
    ): Notification {
        return Notification.create({
            eventId: event.eventId,
            userId: event.data.userId,
            title: "Etiqueta agregada",
            message: `La etiqueta ${event.data.tagName} fue agregada al cliente.`,
            type: "customer.tag-added",
            status: "pending",

            metadata: {
                customerId: event.data.customerId,
                tagId: event.data.tagId,
                tagName: event.data.tagName,
                eventName: event.eventName,
                occurredAt: event.occurredAt,
            },
        });
    }

    /**
     * No implementamos createSendCommand().
     *
     * Se utiliza la implementación de la clase base,
     * que retorna null y evita el envío de correo.
     */
}


// ======================================================
// infrastructure/database/postgres-notification.repository.ts
// ======================================================

interface NotificationRow {
    id: number;
    event_id: string;
    user_id: number;
    title: string;
    message: string;
    type: string;
    status: "pending" | "sent" | "failed";
    metadata: Record<string, unknown>;
}

export class PostgresNotificationRepository
    implements INotificationRepository {
    async save(
        notification: Notification,
    ): Promise<Notification> {
        const sql = `
      INSERT INTO notifications (
        event_id,
        user_id,
        title,
        message,
        type,
        status,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        event_id,
        user_id,
        title,
        message,
        type,
        status,
        metadata
    `;

        const values = [
            notification.eventId,
            notification.userId,
            notification.title,
            notification.message,
            notification.type,
            notification.status,
            notification.metadata,
        ];

        const result = await query<NotificationRow>(
            sql,
            values,
        );

        const row = result.rows[0];

        if (!row) {
            throw new Error(
                "Notification could not be saved",
            );
        }

        return Notification.restore(row.id, {
            eventId: row.event_id,
            userId: row.user_id,
            title: row.title,
            message: row.message,
            type: row.type,
            status: row.status,
            metadata: row.metadata,
        });
    }
}


// ======================================================
// infrastructure/notifications/email-notification.sender.ts
// ======================================================

export class EmailNotificationSender
    implements INotificationSender {
    async send(
        command: SendNotificationCommand,
    ): Promise<void> {
        /*
         * Aquí posteriormente colocás:
         *
         * - Nodemailer
         * - Resend
         * - AWS SES
         * - SendGrid
         */

        console.log("Sending email notification", {
            to: command.to,
            subject: command.subject,
        });

        // Ejemplo:
        //
        // await transporter.sendMail({
        //   from: env.smtp.from,
        //   to: command.to,
        //   subject: command.subject,
        //   html: command.html,
        // });
    }
}


// ======================================================
// infrastructure/messaging/notification-handler.registry.ts
// ======================================================

type RegisteredEventHandler = {
    handle(event: unknown): Promise<void>;
};

export class NotificationHandlerRegistry {
    private readonly handlers =
        new Map<string, RegisteredEventHandler>();

    register<TEvent>(
        eventName: string,
        handler: EventHandler<TEvent>,
    ): void {
        this.handlers.set(eventName, {
            handle: async (event: unknown): Promise<void> => {
                await handler.handle(event as TEvent);
            },
        });
    }

    get(eventName: string): RegisteredEventHandler {
        const handler = this.handlers.get(eventName);

        if (!handler) {
            throw new Error(
                `Handler not found for event: ${eventName}`,
            );
        }

        return handler;
    }
}


// ======================================================
// infrastructure/messaging/notification.consumer.ts
// ======================================================

interface IncomingEvent {
    eventId: string;
    eventName: string;
    occurredAt: string;
    data: unknown;
}

export class NotificationConsumer {
    constructor(
        private readonly handlerRegistry: NotificationHandlerRegistry,
    ) { }

    async consume(event: IncomingEvent): Promise<void> {
        const handler =
            this.handlerRegistry.get(event.eventName);

        /*
         * El consumer no sabe nada de:
         *
         * - PostgreSQL
         * - Correos
         * - Templates
         * - Reglas de negocio
         *
         * Solamente encuentra el handler y ejecuta handle().
         */
        await handler.handle(event);
    }
}


// ======================================================
// main.ts - Composition Root
// ======================================================

// 1. Crear infraestructura compartida.
const notificationRepository =
    new PostgresNotificationRepository();

const notificationSender =
    new EmailNotificationSender();

// 2. Crear handlers e inyectar las dependencias.
// El constructor es heredado de la clase abstracta.

const customerCreatedHandler =
    new CustomerCreatedHandler(
        notificationRepository,
        notificationSender,
    );

const customerTagAddedHandler =
    new CustomerTagAddedHandler(
        notificationRepository,
        notificationSender,
    );

// 3. Registrar los handlers.

const handlerRegistry =
    new NotificationHandlerRegistry();

handlerRegistry.register(
    "customer.created",
    customerCreatedHandler,
);

handlerRegistry.register(
    "customer.tag-added",
    customerTagAddedHandler,
);

// 4. Inyectar el registro en el consumer.

const notificationConsumer =
    new NotificationConsumer(handlerRegistry);

// El callback real de RabbitMQ terminaría ejecutando:
//
// await notificationConsumer.consume(parsedEvent);