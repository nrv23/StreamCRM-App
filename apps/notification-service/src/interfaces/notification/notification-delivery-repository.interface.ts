import { CreateNotificationDeliveryDto } from "../../dto/notifications/create-notification-delivery.dto.ts";
import { NotificationCommand } from "../../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { GetNotificationDeliveriesResponse, NoificationDeliveryResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";

export interface INotificationDeliveryRepository {
    save(dto: CreateNotificationDeliveryDto): Promise<NoificationDeliveryResponse>;
    markAsDelivered(notification_delivery_id: number, message_uuid: string): Promise<void>;
    markAsFailed(notification_delivery_id: number, error_message: string): Promise<void>;
    getNotficationDeliveries(
        status: NotificationDeliveryStatus, limit: number,
        allowedDeliveryChannel: NotificationCommand[],
        delivery_id?: number): Promise<GetNotificationDeliveriesResponse[]>;
    findStatusesByNotificationId(
        notificationId: number,
    ): Promise<NotificationDeliveryStatus[]>;

    setStatusProcessing(deliveries_id: Array<number>): Promise<void>;
}