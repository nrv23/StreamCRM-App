import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { INotificationCommand } from "../notification-command.interface.ts";
import { INotificationResponse } from "../notification/notification-response.interface.ts";

export interface INotificationSender {
    send(command: INotificationCommand): Promise<INotificationResponse>;
}
