export interface INotificationSender {
    send(command: SendNotificationCommand): Promise<void>;
}

export interface SendNotificationCommand {
    to: string;
    subject: string;
    html: string;
}