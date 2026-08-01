import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { NotificationDelivery } from "../../entity/NotificationDeliveries.entity.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { NotificationCreatedRow } from "../../repository/notification/notification-repository.repository.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<NotificationCreatedRow>;
}