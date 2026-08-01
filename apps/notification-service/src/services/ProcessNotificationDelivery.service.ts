import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
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
        const pendingDeliveries =
            await this.getPendingDeliveries();

        if (!pendingDeliveries.length) {
            return false;
        }

        for (const delivery of pendingDeliveries) {
            const command = this.createBodySender(delivery);

            // Fuera de la transacción
            const response = await this._nofiticationDisptcher.dispatch(command);

            // Aquí sí abres transacción para guardar el resultado
            await this._unitOfWork.execute(
                async ({
                    notification,
                    notificationDelivery,
                }) => {
                    if (
                        response.status ===
                        NotificationDeliveryStatus.DELIVERED
                    ) {
                        await notificationDelivery.markAsDelivered(
                            delivery.delivery_id,
                            response.message_uuid!,
                        );
                    } else {
                        await notificationDelivery.markAsFailed(
                            delivery.delivery_id,
                            response.error_message ?? "Unknown error",
                        );
                    }

                    const statuses = await notificationDelivery.findStatusesByNotificationId(delivery.notification_id);
                    const notificationStatus = this.resolveNotificationStatus(statuses);

                    await notification.setNotificationStatus(
                        delivery.notification_id,
                        notificationStatus,
                    );
                },
            );
        }

        return true;
    }

    private resolveNotificationStatus(deliveryStatuses: NotificationDeliveryStatus[]): NotificationStatus {
        if (deliveryStatuses.length === 0) {
            return NotificationStatus.PENDING;
        }

        const allDelivered = deliveryStatuses.every(
            status =>
                status === NotificationDeliveryStatus.DELIVERED,
        );

        if (allDelivered) {
            return NotificationStatus.SENT;
        }

        const allFailed = deliveryStatuses.every(
            status =>
                status === NotificationDeliveryStatus.FAILED,
        );

        if (allFailed) {
            return NotificationStatus.FAILED;
        }

        // Mezcla de delivered, failed o todavía pending.
        return NotificationStatus.PENDING;
    }

    private async getPendingDeliveries():
        Promise<GetNotificationDeliveriesResponse[]> {
        return this._unitOfWork.execute(
            async ({ notificationDelivery }) => {
                return notificationDelivery
                    .getNotficationDeliveries(
                        NotificationDeliveryStatus.PENDING,
                        this._limit,
                    );
            },
        );
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


