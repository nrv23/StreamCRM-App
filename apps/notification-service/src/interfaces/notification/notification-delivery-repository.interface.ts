import { CreateNotificationDeliveryDto } from "../../dto/notifications/create-notification-delivery.dto.ts";

export interface INotificationDeliveryRepository {
    save(dto: CreateNotificationDeliveryDto): Promise<void>;
    markAsDelivered(notification_id: number, message_uuid: string): Promise<void>;
    markAsFailed(notification_id: number, error_message: string): Promise<void>;
}