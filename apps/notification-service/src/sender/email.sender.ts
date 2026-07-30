import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { INotificationCommand, ISendEmailCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { transporter } from "../config/nodemailer.ts";
import { env } from "../config/enviroment.ts";
import { HandlebarsTemplateEngine } from "../handlebars/handlebarsTemplateEngine.ts";

export class EmailSender implements INotificationSender {

    private _templateEngine: HandlebarsTemplateEngine;

    constructor(templateEngine: HandlebarsTemplateEngine) {
        this._templateEngine = templateEngine;
    }

    async send(command: ISendEmailCommand): Promise<void> {
        // El Dispatcher ya debería haber enrutado correctamente, pero hacemos un chequeo de seguridad
        if (command.channel !== NotificationCommand.EMAIL) {
            console.warn(`[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`);
            return;
        }

        try {
            await transporter.sendMail({
                from: env.nodemailer.from, // Puedes cambiar esto si tienes un remitente específico
                to: command.to,
                subject: command.subject,
                html: await this._templateEngine.render(command.templatePath, command.parameters),
            });
            console.log(`[EmailSender] Correo enviado exitosamente a: ${command.to}`);
        } catch (error) {
            console.error(`[EmailSender] Error enviando correo a ${command.to}:`, error);
            // Lanzamos el error para que RabbitMQ pueda marcarlo como fallido y reintentar (NACK)
            throw error;
        }
    }
}
