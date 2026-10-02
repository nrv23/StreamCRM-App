import { NotificationCommand } from "../../enum/Notification-Command.enum.ts";
import { INotificationCommand, ISendEmailCommand, ISendSmsCommand } from "../../interfaces/notification-command.interface.ts";
import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";
import { CREATE_CUSTOMER, LOGIN_USER, RESEND_AUTHCODE_USER } from "../types/events.type..ts";

export class SenderBodyFactory {
    static build(notificationDelivery: GetNotificationDeliveriesResponse): INotificationCommand {
        switch (notificationDelivery.channel) {
            case NotificationCommand.EMAIL:
                return this.buildEmailCommand(notificationDelivery);

            case NotificationCommand.SMS:
                return this.buildSmsCommand(notificationDelivery);

            default:
                throw new Error(`Channel ${notificationDelivery.channel} not implemented in SenderBodyFactory`);
        }
    }

    private static buildEmailCommand(notificationDelivery: GetNotificationDeliveriesResponse): ISendEmailCommand {
        const metadata = notificationDelivery.metadata ?? {};

        switch (metadata.event) {
            case CREATE_CUSTOMER:
                return {
                    to: metadata.email?.toString() ?? "",
                    subject: notificationDelivery.title,
                    templatePath: 'create-customer.handlebars',
                    parameters: [
                        { placeholder: "firstName", value: metadata.firstName?.toString() },
                        { placeholder: "lastName", value: metadata.lastName?.toString() },
                        { placeholder: "email", value: metadata.email?.toString() }
                    ],
                    channel: NotificationCommand.EMAIL
                };
            case RESEND_AUTHCODE_USER:
            case LOGIN_USER:
                return {
                    to: metadata.email?.toString() ?? "",
                    subject: notificationDelivery.title,
                    templatePath: '2fa-auth.code.handlebarse',
                    parameters: [
                        {
                            placeholder: "username",
                            value: `${metadata.firstName ?? ""} ${metadata.lastName ?? ""}`.trim()
                        },
                        {
                            placeholder: "authcode",
                            value: metadata.authcode?.toString() ?? "" // O la clave correcta del metadata
                        }
                    ],
                    channel: NotificationCommand.EMAIL
                };


            default:
                throw new Error(`Event ${metadata.event} not implemented for Email in SenderBodyFactory`);
        }
    }

    private static buildSmsCommand(notificationDelivery: GetNotificationDeliveriesResponse): ISendSmsCommand {
        const metadata = notificationDelivery.metadata ?? {};
        return {
            channel: NotificationCommand.SMS,
            text: `Bienvenido a Stream CRM ${metadata.firstName?.toString() ?? ""} ${metadata.lastName?.toString() ?? ""}`.trim(),
            phoneNumber: metadata.phone?.toString() ?? ""
        };
    }
}
