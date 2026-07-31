import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler } from "./baseNotificationEventHandler.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { NotificationType } from "../enum/notification-type.enum.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";

export class CreateCustomerHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    // AQUÍ INYECTAS TUS DEPENDENCIAS
    constructor(
        unitOfWork: UnitOfWork
    ) {
        // Y se las pasas a la clase base, para que ella pueda guardar en BD
        super(unitOfWork);
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

        if (event.payload.phone) {
            commands.push({
                channel: NotificationCommand.SMS,
                text: `Bienvido a Stream CRM ${event.payload!.firstName?.toString()} ${event.payload!.lastName?.toString()} `,
                phoneNumber: event.payload!.phone?.toString()
            });
        }

        if (event.payload.email) {
            commands.push({
                channel: NotificationCommand.EMAIL,
                to: event.payload.email.toString(),
                subject: notification.title,
                templatePath: 'create-customer.handlebars',
                parameters: [
                    {
                        placeholder: "firstName",
                        value: event.payload!.firstName?.toString()
                    }, {

                        placeholder: "lastName",
                        value: event.payload!.lastName?.toString()
                    }, {
                        placeholder: "email",
                        value: event.payload!.email?.toString()
                    }
                ]
            });
        }

        return commands;
    }
}
