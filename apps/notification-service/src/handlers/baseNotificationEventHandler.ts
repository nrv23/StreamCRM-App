import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationDispatcher } from "./notification-dispatcher.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";

export abstract class BaseNotificationEventHandler<TEvent> implements IntegrationEventHandler<TEvent> {
    constructor(
        protected readonly notificationRepository: INotificationRepository,
        // Ahora inyectamos un 'Dispatcher' o 'Router' en lugar de un Sender de Email directo
        protected readonly notificationDispatcher: INotificationDispatcher
    ) { }

    async handle(event: TEvent): Promise<void> {
        const notification = this.createNotification(event);
        await this.notificationRepository.save(notification);

        // Retorna un array de comandos (puede venir vacío)
        const commands = this.createSendCommands(event, notification);

        for (const command of commands) {
            await this.notificationDispatcher.dispatch(command);
        }
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
