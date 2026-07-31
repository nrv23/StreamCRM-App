import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { NotificationCreatedRow } from "../../repository/notification/notification-repository.repository.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<NotificationCreatedRow>
}