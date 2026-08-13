import { Channels } from "@vonage/messages";
import vonageClient from "../config/sms.ts";
import { ISendSmsCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { Logger } from "winston";
import { env } from "../config/enviroment.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";


export class SmsSender implements INotificationSender {

    private _logger: Logger;

    constructor(logger: Logger) {
        this._logger = logger;
    }
    async send(command: ISendSmsCommand): Promise<INotificationResponse> {

        if (command.channel !== NotificationCommand.SMS) {

            throw `[SmsSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`;
        }

        let response: INotificationResponse = {
            message_uuid: '',
            status: NotificationDeliveryStatus.PENDING
        };
        let log: ILogMetadata;


        try {

            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                payload: JSON.parse(JSON.stringify(command)),
                event: command.channel
            }

            this._logger.info('[SmsSender] Sender command data', log);

            const { messageUUID } = await vonageClient.messages.send({
                messageType: "text",
                channel: Channels.SMS,
                text: command.text.trim(),
                to: command.phoneNumber.trim(),
                from: "StreamCRM", // permite solo 11 caracteres
            });

            response.message_uuid = messageUUID;
            response.status = NotificationDeliveryStatus.DELIVERED;

            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                payload: JSON.parse(JSON.stringify({
                    ...response,
                })),
                event: command.channel
            }

            this._logger.info('[SmsSender] Sms delivered ', log);

        } catch (error) {

            let log: ILogMetadata;
            let errorObject = {
                message: "",
                name: "",
                stack: ""
            }
            if (error instanceof Error) {
                errorObject = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack ?? 'unkown stack trace error'
                };
            }
            else errorObject.message = String(error);
            // Lanzamos el error para que RabbitMQ pueda marcarlo como fallido y reintentar (NACK)
            response.status = NotificationDeliveryStatus.FAILED;
            response.error_message = errorObject.message;

            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                error_message: errorObject.message,
                error_name: errorObject.name,
                error_stack: errorObject.stack,
                event: command.channel,
                payload: JSON.parse(JSON.stringify(command))
            }

            this._logger.error('[SmsSender] Error sending email:', log);
        }

        return response;
    }
}
