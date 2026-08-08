import { Channels } from "@vonage/messages";
import vonageClient from "../config/sms.ts";
import { ISendSmsCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";


export class SmsSender implements INotificationSender {
    async send(command: ISendSmsCommand): Promise<INotificationResponse> {
        console.log({ command });


        if (command.channel !== NotificationCommand.SMS) {

            throw `[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`;
        }

        let response: INotificationResponse = {
            message_uuid: '',
            status: NotificationDeliveryStatus.PENDING
        };

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

            response.message_uuid = messageUUID;
            response.status = NotificationDeliveryStatus.DELIVERED;

        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown email delivery error';

            /* console.error(
                 `[EmailSender] Error enviando sms a ${command.phoneNumber}:`,
                 error,
             );
             console.error(`[EmailSender] Error enviando sms a ${command.phoneNumber}:`, error);*/
            // Lanzamos el error para que RabbitMQ pueda marcarlo como fallido y reintentar (NACK)
            response.status = NotificationDeliveryStatus.FAILED;
            response.error_message = errorMessage;
        }

        return response;
    }
}
