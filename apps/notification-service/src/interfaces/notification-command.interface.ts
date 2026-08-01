import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { TemplateParameter } from "./templateEngine.interface.ts";

// application/contracts/notification-commands.ts

export type ISendEmailCommand = {
    channel: NotificationCommand.EMAIL;
    to: string;
    subject: string;
    templatePath: string;
    parameters: TemplateParameter[];
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

// Pendientes
// cambiar metodo createCommand a createBodyNotificationDelivery
// en el servicio de proceso de notiicaciones delivery crear el metodo para los bodies de los envios.
// validar si todas las deliveries se procesaron bien para marcarlos delivered y la notficacion como sent.