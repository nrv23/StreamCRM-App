import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { INotificationCommand, ISendEmailCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { transporter } from "../config/nodemailer.ts";
import { env } from "../config/enviroment.ts";
import { HandlebarsTemplateEngine } from "../handlebars/handlebarsTemplateEngine.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";

export class EmailSender implements INotificationSender {

    private _templateEngine: HandlebarsTemplateEngine;

    constructor(templateEngine: HandlebarsTemplateEngine) {
        this._templateEngine = templateEngine;
    }

    async send(command: ISendEmailCommand): Promise<INotificationResponse> {
        // El Dispatcher ya debería haber enrutado correctamente, pero hacemos un chequeo de seguridad


        if (command.channel !== NotificationCommand.EMAIL) {
            throw `[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`;
        }


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

            console.log(`[EmailSender] Correo enviado exitosamente a: ${command.to}`);
        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown email delivery error';

            console.error(
                `[EmailSender] Error enviando correo a ${command.to}:`,
                error,
            );
            console.error(`[EmailSender] Error enviando correo a ${command.to}:`, error);
            // Lanzamos el error para que RabbitMQ pueda marcarlo como fallido y reintentar (NACK)
            response.status = NotificationDeliveryStatus.FAILED;
            response.error_message = errorMessage;
        }

        return response;
    }
}
