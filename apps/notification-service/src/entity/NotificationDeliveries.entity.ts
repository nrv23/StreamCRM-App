
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";


export class NotificationDelivery {

    constructor(
        public readonly id: number,
        public notification_id: number,
        public channel: NotificationCommand,
        public status: NotificationDeliveryStatus,
        public error_message: string,
        public attempts: number = 0,
        public provider_message_id: string = '',
        public delivered_at?: Date,
        public created_at?: Date,
        public failed_at?: Date,
    ) {

    }
}