import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";
import { NotificationStatus } from "../shared/types/notification-status.type.ts";
import { NotificationType } from "../shared/types/notification-type.type.ts";


export class CustomerStatusChangeHandler implements IntegrationEventHandler {
    private _notificationRepository: INotificationRepository;

    constructor(notificationRepository: INotificationRepository) {
        this._notificationRepository = notificationRepository
    }
    async handle(event: RabbitEventDto): Promise<void> {

        await this._notificationRepository.save({
            external_id: event.external_id,
            eventId: event.event_id,
            eventName: event.event_name,
            userId: +event.payload.user_id!,
            title: 'New Customer Status',
            message: `previousStatus: ${event.payload.previousStatus} newStatus: ${event.payload.newStatus}`,
            type: NotificationType.INFO,
            status: NotificationStatus.PENDING,
            metadata: event.payload
        })
    }
}