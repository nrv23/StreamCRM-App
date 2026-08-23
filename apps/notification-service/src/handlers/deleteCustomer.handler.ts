import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { BaseNotificationEventHandler, CreateNotificationBodyDataResponse } from "./baseNotificationEventHandler.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { NotificationType } from "../enum/notification-type.enum.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";
import { IRedisEmitter } from "../interfaces/publisher/RedisEmitter.publisher.ts";

export class DeleteCustomerHandler extends BaseNotificationEventHandler<RabbitEventDto> {

    constructor(
        public unitOfWork: UnitOfWork,
        public emitter: IRedisEmitter,
        public limit: number

    ) {
        // Y se las pasas a la clase base, para que ella pueda guardar en BD
        super(unitOfWork, limit, emitter)
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
    protected createNotificationDeliveryBody(event: RabbitEventDto, notification_id: number): CreateNotificationBodyDataResponse[] {
        const newNotificationDeliveries: CreateNotificationBodyDataResponse[] = [];
        newNotificationDeliveries.push({
            notification_id,
            channel: NotificationCommand.INAPP
        });

        return newNotificationDeliveries;
    }
}