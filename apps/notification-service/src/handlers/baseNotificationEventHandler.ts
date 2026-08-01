import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";

export type CreateNotificationBodyDataResponse = {
    channel: NotificationCommand,
    notification_id: number;
}
export abstract class BaseNotificationEventHandler<TEvent> implements IntegrationEventHandler<TEvent> {
    constructor(
        protected readonly unitOfWork: UnitOfWork,
    ) { }

    async handle(event: TEvent): Promise<void> {
        return this.unitOfWork.execute(async ({ notification, notificationDelivery }) => {
            const newNotification = this.createNotification(event);
            const notificationResponse = await notification.save(newNotification);
            const commands = this.createNotificationDeliveryBody(event, notificationResponse.id);

            // Retorna un array de comandos (puede venir vacío)
            for (const command of commands) {
                await notificationDelivery.save({ // se guarda el intento de envio
                    notification_id: command.notification_id,
                    channel: command.channel
                });
                //await this.notificationDispatcher.dispatch(command);
            }
        })
    }

    protected abstract createNotification(event: TEvent): CreateNotificationDto;

    // Retorna array vacío por defecto
    protected createNotificationDeliveryBody(
        _event: TEvent,
        _notification_id: number
    ): CreateNotificationBodyDataResponse[] {
        return [];
    }
}
