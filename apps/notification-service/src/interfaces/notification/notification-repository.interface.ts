import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { GetNotificationsDto } from "../../dto/notifications/get-notifications.dto.ts";
import { NotificationStatus } from "../../enum/notification-status.enum.ts";
import { GetNotificationsResponse, NotificationCreatedRow } from "../../repository/notification/notification-repository.repository.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<NotificationCreatedRow>;
    setNotificationStatus(notification_id: number, status: NotificationStatus): Promise<void>;
    searchByFilters(dto: GetNotificationsDto): Promise<GetNotificationsResponse[]>;
    getTotalRecords(dto: GetNotificationsDto): Promise<number>;
}