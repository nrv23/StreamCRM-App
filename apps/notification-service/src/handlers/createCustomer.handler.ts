import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler } from "./baseNotificationEventHandler.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationStatus } from "../shared/types/notification-status.type.ts";
import { NotificationType } from "../shared/types/notification-type.type.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";
import { INotificationDispatcher } from "./notification-dispatcher.ts";

export class CreateCustomerHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    // AQUÍ INYECTAS TUS DEPENDENCIAS
    constructor(
        notificationRepository: INotificationRepository,
        notificationDispatcher: INotificationDispatcher
    ) {
        // Y se las pasas a la clase base, para que ella pueda guardar en BD
        super(notificationRepository, notificationDispatcher);
    }

    // Ya NO necesitas escribir el método handle() aquí, porque lo heredas del padre.
    // Solo te preocupas por definir QUÉ se va a guardar:
    protected createNotification(event: RabbitEventDto): CreateNotificationDto {
        return {
            external_id: event.external_id,
            eventId: event.event_id,
            eventName: event.event_name,
            userId: +event.payload.user_id!,
            title: 'New Customer',
            message: `Welcome ${event.payload.firstName} ${event.payload.lastName}`,
            type: NotificationType.INFO,
            status: NotificationStatus.PENDING,
            metadata: event.payload
        };
    }

    // Y QUÉ notificaciones se van a enviar:
    protected createSendCommands(
        event: RabbitEventDto,
        notification: CreateNotificationDto
    ): INotificationCommand[] {
        const commands: INotificationCommand[] = [];

        if (event.payload.email) {
            commands.push({
                channel: NotificationCommand.EMAIL,
                to: event.payload.email.toString(),
                subject: notification.title,
                html: `<h1>Welcome ${event.payload.firstName}</h1>`
            });
        }

        return commands;
    }
}
