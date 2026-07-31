
import { NotificationCommand } from "../../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";

export interface CreateNotificationDeliveryDto {
    notification_id: number;
    channel: NotificationCommand
}