import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { INotificationDispatcher } from "../handlers/notification-dispatcher.ts";
import { INotificationCommand, ISendEmailCommand, ISendSmsCommand } from "../interfaces/notification-command.interface.ts";
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";


export class ProcessNotificationDeliveryService {

    private _unitOfWork: UnitOfWork;
    private _nofiticationDisptcher: INotificationDispatcher;
    private _limit: number;

    constructor(
        unitOfWork: UnitOfWork,
        notificationDisptcher: INotificationDispatcher,
        limit: number

    ) {
        this._unitOfWork = unitOfWork;
        this._nofiticationDisptcher = notificationDisptcher;
        this._limit = limit;
    }

    async execute(): Promise<boolean> {

        return this._unitOfWork.execute(async ({ notification, notificationDelivery }) => {

            const pendingDeliveries = await notificationDelivery.getNotficationDeliveries(NotificationDeliveryStatus.PENDING, this._limit);

            if (!pendingDeliveries.length) return false;

            for (const delivery of pendingDeliveries) {

                const bodySender = this.createBodySender(delivery);
                const sendNotificationResponse = await this._nofiticationDisptcher.dispatch(bodySender);

                console.log({ sendNotificationResponse })
            }

            return true;
        })
    }

    private createBodySender(notificationDelivery: GetNotificationDeliveriesResponse) {
        let pendingDelivery: INotificationCommand;

        switch (notificationDelivery.channel) {

            case NotificationCommand.EMAIL: {

                const emailBodySender: ISendEmailCommand = {
                    to: notificationDelivery.metadata!.email!.toString(),
                    subject: notificationDelivery.title,
                    templatePath: 'create-customer.handlebars',
                    parameters: [
                        {
                            placeholder: "firstName",
                            value: notificationDelivery.metadata!.firstName?.toString()
                        }, {
                            placeholder: "lastName",
                            value: notificationDelivery.metadata!.lastName?.toString()
                        }, {
                            placeholder: "email",
                            value: notificationDelivery.metadata!.email?.toString()
                        }
                    ],
                    channel: NotificationCommand.EMAIL
                }

                pendingDelivery = emailBodySender;

                break;
            }

            case NotificationCommand.SMS:
                const smsBodySender: ISendSmsCommand = {
                    channel: NotificationCommand.SMS,
                    text: `Bienvido a Stream CRM ${notificationDelivery.metadata!.firstName?.toString()} ${notificationDelivery.metadata!.lastName?.toString()} `,
                    phoneNumber: notificationDelivery.metadata!.phone?.toString()!
                }
                pendingDelivery = smsBodySender;
                break;
            default:
                throw new Error("Channel not implemented to createBodySender");
        }


        return pendingDelivery;
    }
}


