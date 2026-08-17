import { Logger } from "winston";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { INotificationDispatcher } from "../handlers/notification-dispatcher.ts";
import { INotificationCommand, ISendEmailCommand, ISendSmsCommand } from "../interfaces/notification-command.interface.ts";
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";


export class ProcessNotificationDeliveryService {

    private _unitOfWork: UnitOfWork;
    private _nofiticationDisptcher: INotificationDispatcher;
    private _limit: number;
    private _logger: Logger;
    constructor(
        unitOfWork: UnitOfWork,
        notificationDisptcher: INotificationDispatcher,
        limit: number,
        logger: Logger

    ) {
        this._unitOfWork = unitOfWork;
        this._nofiticationDisptcher = notificationDisptcher;
        this._limit = limit;
        this._logger = logger;
    }

    async execute(): Promise<boolean> {
        const pendingDeliveries = await this.getPendingDeliveries();
        let log: ILogMetadata;
        if (!pendingDeliveries.length) {
            return false;
        }

        for (const delivery of pendingDeliveries) {

            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                entity_id: delivery.delivery_id,
                event: delivery.channel,
                event_id: delivery.notification_external_id,
                payload: JSON.parse(JSON.stringify(delivery.metadata))
            };
            this._logger.info('Processing notification delivery', log)

            const command = this.createBodySender(delivery);

            // Fuera de la transacción
            const response = await this._nofiticationDisptcher.dispatch(command);

            this._logger.info('Notification delivery dispatching', log);


            // Aquí sí abres transacción para guardar el resultado
            await this._unitOfWork.execute(async ({
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
                    this._logger.info('Notification delivery markAsDelivered', log);
                } else {
                    await notificationDelivery.markAsFailed(
                        delivery.delivery_id,
                        response.error_message ?? "Unknown error",
                    );

                    this._logger.info('Notification delivery markAsFailed', log);
                }

                const statuses = await notificationDelivery.findStatusesByNotificationId(delivery.notification_id);
                const notificationStatus = this.resolveNotificationStatus(statuses);

                await notification.setNotificationStatus(
                    delivery.notification_id,
                    notificationStatus,
                );

                log = {
                    service: env.service_name,
                    created_at: new Date().toISOString(),
                    entity_id: delivery.notification_id,
                    event_id: delivery.notification_external_id,
                    payload: JSON.parse(JSON.stringify(delivery.metadata))
                }

                this._logger.info('Notification update status', log);
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

    private async getPendingDeliveries(): Promise<GetNotificationDeliveriesResponse[]> {
        return this._unitOfWork.execute(async ({ notificationDelivery }) => {
            const pendingDeliveries = await notificationDelivery.getNotficationDeliveries(
                NotificationDeliveryStatus.PENDING,
                this._limit,
                [NotificationCommand.EMAIL, NotificationCommand.SMS]
            );
            const processingDeliveriesId = pendingDeliveries.map(delivery => delivery.delivery_id);
            await notificationDelivery.setStatusProcessing(processingDeliveriesId);

            return pendingDeliveries;
        });
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


