import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<void>
}