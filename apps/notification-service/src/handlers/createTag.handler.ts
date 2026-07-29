import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";
import { NotificationStatus } from "../shared/types/notification-status.type.ts";
import { NotificationType } from "../shared/types/notification-type.type.ts";


export class CreateTagHandler implements IntegrationEventHandler {
    private _notificationRepository: INotificationRepository;

    constructor(notificationRepository: INotificationRepository) {
        this._notificationRepository = notificationRepository
    }
    async handle(event: CreateNotificationDto): Promise<void> {

        event.title = 'New Tag created';
        event.message = `Tag created with name ${event.metadata.tag_name}`
        event.type = NotificationType.INFO;
        event.status = NotificationStatus.PENDING;
        await this._notificationRepository.save(event)
    }
}