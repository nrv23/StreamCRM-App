import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { GetNotificationsDto } from "../../dto/notifications/get-notifications.dto.ts";
import { NotificationEntity } from "../../entity/Notification.entity.ts";
import { NotificationCommand } from "../../enum/Notification-Command.enum.ts";
import { NotificationStatus } from "../../enum/notification-status.enum.ts";
import { GetNotficationByIdResponse, GetNotificationsResponse, GetUnReadNotificationsCount, NotificationCreatedRow } from "../../repository/notification/notification-repository.repository.ts";

export interface INotificationRepository {
    save(dto: CreateNotificationDto): Promise<NotificationCreatedRow>;
    setNotificationStatus(notification_id: number, status: NotificationStatus): Promise<void>;
    searchByFilters(dto: GetNotificationsDto): Promise<GetNotificationsResponse[]>;
    getTotalRecords(dto: GetNotificationsDto): Promise<number>;
    markAsRead(notification_id: number, user_id: number): Promise<void>;
    getNotficationById(notification_id: number, user_id: number): Promise<GetNotficationByIdResponse[]>;
    geUnreadNotificactionsCount(user_id: number, channel: NotificationCommand): Promise<GetUnReadNotificationsCount>;
}