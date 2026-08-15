import { NotificationStatus } from "../../enum/notification-status.enum.ts";
import { NotificationType } from "../../enum/notification-type.enum.ts";

export interface GetNotificationsDto {
    page?: number | null;
    limit?: number;
    status?: NotificationStatus;
    type?: NotificationType;
    search?: string | null;
    user_id: number;
}
