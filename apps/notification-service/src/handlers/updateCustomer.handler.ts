import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { INotificationRepository } from "../interfaces/notification/notification-repository.interface.ts";


export class UpdateCustomerHandler implements IntegrationEventHandler {
    private _notificationRepository: INotificationRepository;

    constructor(notificationRepository: INotificationRepository) {
        this._notificationRepository = notificationRepository
    }
    async handle(event: CreateNotificationDto): Promise<void> {

        await this._notificationRepository.save(event)
    }
}