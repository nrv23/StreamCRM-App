import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { EmailSender } from "../sender/email.sender.ts";
import { SmsSender } from "../sender/sms.sender.ts";

export interface INotificationDispatcher {
    dispatch(command: INotificationCommand): Promise<INotificationResponse>;
}
export class NotificationDispatcher implements INotificationDispatcher {
    constructor(
        private _emailSender: EmailSender,
        private _smsSender: SmsSender
        // private readonly pushSender: IPushSender
    ) { }
    async dispatch(command: INotificationCommand): Promise<INotificationResponse> {
        let response: INotificationResponse;
        switch (command.channel) {
            case NotificationCommand.EMAIL:
                response = await this._emailSender.send(command);
                break;

            case NotificationCommand.SMS:
                response = await this._smsSender.send(command);
                break;

            //case NotificationCommand.PUSH:
            // await this.pushSender.sendPush(command);

            default:
                // TypeScript te avisará aquí si olvidas agregar un case
                throw new Error(`Channel not implemented`);
        }

        return response;
    }
}