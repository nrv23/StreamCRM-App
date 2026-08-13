import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { INotificationCommand, ISendEmailCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { transporter } from "../config/nodemailer.ts";
import { env } from "../config/enviroment.ts";
import { HandlebarsTemplateEngine } from "../handlebars/handlebarsTemplateEngine.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";

export class EmailSender implements INotificationSender {

    private _templateEngine: HandlebarsTemplateEngine;
    private _logger: Logger;
    constructor(templateEngine: HandlebarsTemplateEngine, logger: Logger) {
        this._templateEngine = templateEngine;
        this._logger = logger;
    }

    async send(command: ISendEmailCommand): Promise<INotificationResponse> {
        // El Dispatcher ya debería haber enrutado correctamente, pero hacemos un chequeo de seguridad
        let log: ILogMetadata;

        if (command.channel !== NotificationCommand.EMAIL) {
            throw `[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`;
        }

        log = {
            service: env.service_name,
            created_at: new Date().toISOString(),
            payload: JSON.parse(JSON.stringify(command)),
            event: command.channel
        }

        this._logger.info('[EmailSender] Sender command data', log);


        let response: INotificationResponse = {
            message_uuid: '',
            status: NotificationDeliveryStatus.PENDING
        };

        try {
            const sendEmailResponse = await transporter.sendMail({
                from: env.nodemailer.from, // Puedes cambiar esto si tienes un remitente específico
                to: command.to,
                subject: command.subject,
                html: await this._templateEngine.render(command.templatePath, command.parameters),
            });



            response.status = NotificationDeliveryStatus.DELIVERED
            response.message_uuid = sendEmailResponse.messageId || 'uknown message id';


            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                payload: JSON.parse(JSON.stringify({
                    ...response,
                })),
                event: command.channel
            }

            this._logger.info('[EmailSender] Email delivered ', log);

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
            // publicar log de error 

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

            this._logger.error('[EmailSender] Error sending email:', log);
        }

        return response;
    }
}
