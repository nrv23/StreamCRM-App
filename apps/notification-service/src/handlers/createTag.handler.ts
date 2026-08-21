import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler, CreateNotificationBodyDataResponse } from "./baseNotificationEventHandler.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { NotificationType } from "../enum/notification-type.enum.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";
import { RedisPublisher } from "../publisher/Redis.publisher.ts";

export class CreateTagHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    constructor(
        public unitOfWork: UnitOfWork,
        public redisPublisher: RedisPublisher,
        public limit: number

    ) {
        // Y se las pasas a la clase base, para que ella pueda guardar en BD
        super(unitOfWork, limit, redisPublisher)
    }

    protected createNotification(event: RabbitEventDto): CreateNotificationDto {
        return {
            external_id: event.external_id,
            eventId: event.event_id,
            eventName: event.event_name,
            userId: +event.payload.user_id!,
            title: 'New Tag created',
            message: `Tag created with name ${event.payload.tag_name}`,
            type: NotificationType.INFO,
            status: NotificationStatus.PENDING,
            metadata: event.payload
        };
    }

    protected createNotificationDeliveryBody(event: RabbitEventDto, notification_id: number): CreateNotificationBodyDataResponse[] {
        const newNotificationDeliveries: CreateNotificationBodyDataResponse[] = [];
        newNotificationDeliveries.push({
            notification_id,
            channel: NotificationCommand.INAPP
        });

        return newNotificationDeliveries;
    }
}