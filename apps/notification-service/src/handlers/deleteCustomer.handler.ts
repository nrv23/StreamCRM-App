import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler } from "./baseNotificationEventHandler.ts";
import { NotificationStatus } from "../shared/types/notification-status.type.ts";
import { NotificationType } from "../shared/types/notification-type.type.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";
import { INotificationDispatcher } from './notification-dispatcher.ts'

export class DeleteCustomerHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    constructor(
        notificationRepository: INotificationRepository,
        notificationDispatcher: INotificationDispatcher
    ) {
        super(notificationRepository, notificationDispatcher);
    }

    protected createNotification(event: RabbitEventDto): CreateNotificationDto {
        return {
            external_id: event.external_id,
            eventId: event.event_id,
            eventName: event.event_name,
            userId: +event.payload.user_id!,
            title: 'Customer Soft deleted',
            message: `previousStatus: ${event.payload.previousStatus} newStatus: ${event.payload.newStatus}`,
            type: NotificationType.INFO,
            status: NotificationStatus.PENDING,
            metadata: event.payload
        };
    }
}