import { NotificationCommand } from "../enum/Notification-Command.enum.ts";

// application/contracts/notification-commands.ts

export type ISendEmailCommand = {
    channel: NotificationCommand.EMAIL;
    to: string;
    subject: string;
    html: string;
};

export type ISendSmsCommand = {
    channel: NotificationCommand.SMS;
    phoneNumber: string;
    text: string;
};

export type ISendPushCommand = {
    channel: NotificationCommand.PUSH;
    deviceToken: string;
    title: string;
    body: string;
};

// Unión discriminada:
export type INotificationCommand = ISendEmailCommand | ISendSmsCommand | ISendPushCommand;
