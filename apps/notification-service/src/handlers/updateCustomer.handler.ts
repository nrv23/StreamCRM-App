import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler } from "./baseNotificationEventHandler.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { NotificationType } from "../enum/notification-type.enum.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";

export class UpdateCustomerHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    constructor(
        unitOfWork: UnitOfWork
    ) {
        // Y se las pasas a la clase base, para que ella pueda guardar en BD
        super(unitOfWork);
    }

    protected createNotification(event: RabbitEventDto): CreateNotificationDto {
        return {
            external_id: event.external_id,
            eventId: event.event_id,
            eventName: event.event_name,
            userId: +event.payload.user_id!,
            title: 'Customer Updated',
            message: `Customer information was updated`,
            type: NotificationType.INFO,
            status: NotificationStatus.PENDING,
            metadata: event.payload
        };
    }
}