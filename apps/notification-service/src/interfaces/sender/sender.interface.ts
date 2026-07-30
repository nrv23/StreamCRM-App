import { INotificationCommand } from "../notification-command.interface.ts";

export interface INotificationSender {
    send(command: INotificationCommand): Promise<void>;
}
