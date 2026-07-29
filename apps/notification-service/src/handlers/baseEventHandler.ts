import { Notification } from "pg";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";
import { INotificationSender, SendNotificationCommand } from "../interfaces/sender/sender.interface.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";

export abstract class BaseNotificationEventHandler<TEvent>
    implements IntegrationEventHandler<TEvent> {

    constructor(
        protected readonly notificationRepository: INotificationRepository,
        protected readonly notificationSender: INotificationSender
    ) { }

    async handle(event: TEvent): Promise<void> {
        const notification = this.createNotification(event);
        await this.notificationRepository.save(notification);

        if (this.shouldSendEmail(event)) {
            const email = this.createEmail(event, notification);
            await this.notificationSender.send(email);
        }
    }

    protected abstract createNotification(
        event: TEvent
    ): CreateNotificationDto;

    protected abstract createEmail(
        event: TEvent,
        notification: CreateNotificationDto
    ): SendNotificationCommand;

    protected shouldSendEmail(_event: TEvent): boolean {
        return true;
    }
}