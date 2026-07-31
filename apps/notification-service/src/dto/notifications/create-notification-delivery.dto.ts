import { NotificationChannel } from "../../enum/Notification-Channel.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";

export interface CreateNotificationDeliveryDto {
    notification_id: number;
    channel: NotificationChannel
}