import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { IRedisPublisher } from "../interfaces/publisher/RedisPublisher.interface.ts";
import { STREAM_CRM_EVENT } from "../shared/types/events.type..ts";
import { SocketUtils } from "../shared/utils/socket-utils.ts";
import { SocketMessage } from "../interfaces/socket/SocketMessage.interface.ts";


export type CreateNotificationBodyDataResponse = {
    channel: NotificationCommand,
    notification_id: number;
}
export abstract class BaseNotificationEventHandler<TEvent> implements IntegrationEventHandler<TEvent> {
    constructor(
        protected readonly unitOfWork: UnitOfWork,
        protected readonly limit: number,
        protected readonly redisPublisher: IRedisPublisher
    ) {
    }

    async handle(event: TEvent): Promise<void> {


        await this.unitOfWork.execute(async ({ notification, notificationDelivery }) => {
            const newNotification = this.createNotification(event);
            const notificationResponse = await notification.save(newNotification);
            const commands = this.createNotificationDeliveryBody(event, notificationResponse.id);

            // Retorna un array de comandos (puede venir vacío)
            for (const command of commands) {
                const deliveryResponse = await notificationDelivery.save({ // se guarda el intento de envio
                    notification_id: command.notification_id,
                    channel: command.channel,
                });

                const pendingDeliveries = await notificationDelivery.getNotficationDeliveries(
                    NotificationDeliveryStatus.PENDING,
                    this.limit,
                    [NotificationCommand.INAPP],
                    deliveryResponse.id
                );

                if (pendingDeliveries.length) {
                    const processingDeliveriesId = pendingDeliveries.map(delivery => delivery.delivery_id);

                    await notificationDelivery.setStatusProcessing(processingDeliveriesId);
                    try {
                        await notificationDelivery.markAsDelivered(
                            deliveryResponse.id,
                            '',
                        );

                        const statuses = await notificationDelivery.findStatusesByNotificationId(command.notification_id);
                        const notificationStatus = this.resolveNotificationStatus(statuses);

                        await notification.setNotificationStatus(
                            command.notification_id,
                            notificationStatus,
                        );
                    } catch (err) {
                        const error = err instanceof Error ? err.message : String(err);
                        await notificationDelivery.markAsFailed(deliveryResponse.id, error);
                    }

                    //await this.notificationDispatcher.dispatch(command);
                    if (pendingDeliveries[0]) {
                        const message = SocketUtils.buildMessage(pendingDeliveries[0]);
                        message && await this.redisPublisher.publish<SocketMessage>(STREAM_CRM_EVENT, message);
                        //if (message) await this.redisPublisher.publish<SocketMessage>(STREAM_CRM_EVENT, message);
                    }
                }
            }
        });
    }

    protected abstract createNotification(event: TEvent): CreateNotificationDto;

    // Retorna array vacío por defecto
    protected createNotificationDeliveryBody(
        _event: TEvent,
        _notification_id: number
    ): CreateNotificationBodyDataResponse[] {
        return [];
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
}
