import { CreateNotificationDeliveryDto } from "../../dto/notifications/create-notification-delivery.dto.ts";
import { NotificationDelivery } from "../../entity/NotificationDeliveries.entity.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { GetNotificationDeliveriesResponse, NoificationDeliveryResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";

export interface INotificationDeliveryRepository {
    save(dto: CreateNotificationDeliveryDto): Promise<NoificationDeliveryResponse>;
    markAsDelivered(notification_delivery_id: number, message_uuid: string): Promise<void>;
    markAsFailed(notification_delivery_id: number, error_message: string): Promise<void>;
    getNotficationDeliveries(status: NotificationDeliveryStatus, limit: number): Promise<GetNotificationDeliveriesResponse[]>;
}