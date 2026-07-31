import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";


export abstract class BaseNotificationEventHandler<TEvent> implements IntegrationEventHandler<TEvent> {
    constructor(
        protected readonly unitOfWork: UnitOfWork,
    ) { }

    async handle(event: TEvent): Promise<void> {
        return this.unitOfWork.execute(async ({ notification, notificationDelivery }) => {
            const newNotification = this.createNotification(event);
            const notificationResponse = await notification.save(newNotification);
            const commands = this.createSendCommands(event, newNotification);

            // Retorna un array de comandos (puede venir vacío)
            for (const command of commands) {
                await notificationDelivery.save({ // se guarda el intento de envio
                    notification_id: notificationResponse.id,
                    channel: command.channel
                });
                //await this.notificationDispatcher.dispatch(command);
            }
        })
    }

    protected abstract createNotification(event: TEvent): CreateNotificationDto;

    // Retorna array vacío por defecto
    protected createSendCommands(
        _event: TEvent,
        _notification: CreateNotificationDto,
    ): INotificationCommand[] {
        return [];
    }
}
