import { Channels } from "@vonage/messages";
import vonageClient from "../config/sms.ts";
import { ISendSmsCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";


export class SmsSender implements INotificationSender {
    async send(command: ISendSmsCommand): Promise<void> {
        console.log({ command })
        if (command.channel !== NotificationCommand.SMS) {
            console.warn(`[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`);
            return;
        }

        try {
            const { messageUUID } = await vonageClient.messages.send({
                messageType: "text",
                channel: Channels.SMS,
                text: command.text.trim(),
                to: command.phoneNumber.trim(),
                from: "StreamCRM", // permite solo 11 caracteres
            });

            console.log(`Sms sended to ${command.phoneNumber} :) !!`)
            console.log(`messageUUID : ${messageUUID}`);

        } catch (error) {
            console.log("Error was ocurred trying sending sms...", error);
            throw error;
        }
    }
}
