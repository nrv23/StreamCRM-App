import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { EmailSender } from "../sender/email.sender.ts";
import { SmsSender } from "../sender/sms.sender.ts";

export interface INotificationDispatcher {
    dispatch(command: INotificationCommand): Promise<void>;
}
export class NotificationDispatcher implements INotificationDispatcher {
    constructor(
        private _emailSender: EmailSender,
        private _smsSender: SmsSender
        // private readonly pushSender: IPushSender
    ) { }
    async dispatch(command: INotificationCommand): Promise<void> {
        switch (command.channel) {
            case 'email':
                await this._emailSender.send(command);
                break;

            case 'sms':
                await this._smsSender.send(command);
                break;

            case 'push':
                // await this.pushSender.sendPush(command);
                break;
            default:
                // TypeScript te avisará aquí si olvidas agregar un case
                throw new Error(`Canal no soportado`);
        }
    }
}