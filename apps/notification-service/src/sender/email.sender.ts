import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { transporter } from "../config/nodemailer.ts";
import { env } from "../config/enviroment.ts";

export class EmailSender implements INotificationSender {
    async send(command: INotificationCommand): Promise<void> {
        // El Dispatcher ya debería haber enrutado correctamente, pero hacemos un chequeo de seguridad
        if (command.channel !== NotificationCommand.EMAIL) {
            console.warn(`[EmailSender] Se intentó procesar un comando de tipo ${command.channel} en el sender de Email`);
            return;
        }

        try {
            await transporter.sendMail({
                from: env.nodemailer.auth.user, // Puedes cambiar esto si tienes un remitente específico
                to: command.to,
                subject: command.subject,
                html: command.html,
            });
            console.log(`[EmailSender] Correo enviado exitosamente a: ${command.to}`);
        } catch (error) {
            console.error(`[EmailSender] Error enviando correo a ${command.to}:`, error);
            // Lanzamos el error para que RabbitMQ pueda marcarlo como fallido y reintentar (NACK)
            throw error;
        }
    }
}
