import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";


export interface INotificationResponse {
    message_uuid?: string;
    status: NotificationDeliveryStatus;
    error_message?: string;
}