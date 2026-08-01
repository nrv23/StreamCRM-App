import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { NotificationDelivery } from "../../entity/NotificationDeliveries.entity.ts";
import { NotificationStatus } from "../../enum/notification-status.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { NotificationCreatedRow } from "../../repository/notification/notification-repository.repository.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<NotificationCreatedRow>;
    setNotificationStatus(notification_id: number, status: NotificationStatus): Promise<void>;
}