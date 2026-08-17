import { SocketServer } from "../config/socketio.ts"
import { UnitOfWork } from "../config/unitOfWork.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../enum/NotificationDeliveryStatus.enum.ts";
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { CHANGE_CUSTOMER_STATUS, CREATE_TAG, DELETE_CUSTOMER, UPDATE_CUSTOMER } from "../shared/types/events.type..ts";
import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";

export type SocketPayload = {
    message: string;
    data: JsonObject;
}

export class SocketPublisher implements ISocketPublisher {

    private _socket: SocketServer;
    private _unitOfWork: UnitOfWork;
    private _limit: number;
    private _logger: Logger;
    constructor(
        socket: SocketServer,
        unitOfWork: UnitOfWork,
        limit: number,
        logger: Logger
    ) {
        this._socket = socket;
        this._unitOfWork = unitOfWork;
        this._limit = limit;
        this._logger = logger;
    }

    public async publish() {
        return await this._unitOfWork.execute(async ({ notification, notificationDelivery }) => {
            let log: ILogMetadata;
            // obtener los deliveries pendientes 

            const pendingInAppDeliveries = await this.getPendingDeliveries();

            for (const delivery of pendingInAppDeliveries) {
                // generar log 

                log = {
                    service: env.service_name,
                    created_at: new Date().toISOString(),
                    entity_id: delivery.delivery_id,
                    event: delivery.channel,
                    event_id: delivery.notification_external_id,
                    payload: JSON.parse(JSON.stringify(delivery.metadata))
                };



                const payload = this.setSocketPayload(delivery);
                if (payload) {
                    // actualizar el delivery a delivered y delivered_at
                    await notificationDelivery.markAsDelivered(
                        delivery.delivery_id,
                        'No message id generated'
                    );

                    this._logger.info('Notification delivery markAsDelivered', log);
                    // actualizar la notificacion a sent.
                    await notification.setNotificationStatus(delivery.notification_id, NotificationStatus.SENT);

                    this._logger.info('Notification markAsSent', log);
                    // enviar la notificacion por socket usando el room {user:user_id}
                    const room = `user:${delivery.metadata.user_id!.toString()}`;
                    this._socket.emitToRoom(room, delivery.metadata.event!.toString(), payload);
                    this._logger.info('Notification was sent using socket...', log);
                }

            }
        });
    }

    private setSocketPayload(delivery: GetNotificationDeliveriesResponse): SocketPayload | null {
        let newPayload: SocketPayload | null;

        switch (delivery.metadata!.event!.toString()) {
            case UPDATE_CUSTOMER:
                newPayload = {
                    message: 'Customer info was updated',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                    }
                }
                break;

            case CHANGE_CUSTOMER_STATUS:
                newPayload = {
                    message: 'Customer status was changed',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                        prevStatus: delivery.metadata.previousStatus?.toString()!,
                        newStatus: delivery.metadata.newStatus!.toString(),
                    }
                }
                break;

            case DELETE_CUSTOMER:
                newPayload = {
                    message: 'Customer was deleted',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                    }
                }
                break;

            case CREATE_TAG:
                newPayload = {
                    message: 'Tag was created',
                    data: {
                        tag_id: delivery.metadata!.tag_id!,
                        tag_name: delivery.metadata!.tag_name!.toString()
                    }
                }
                break;
            default:
                newPayload = null;
        }

        return newPayload;
    }

    private async getPendingDeliveries(): Promise<GetNotificationDeliveriesResponse[]> {
        return this._unitOfWork.execute(async ({ notificationDelivery }) => {
            const pendingDeliveries = await notificationDelivery.getNotficationDeliveries(
                NotificationDeliveryStatus.PENDING,
                this._limit,
                [NotificationCommand.INAPP]
            );
            const processingDeliveriesId = pendingDeliveries.map(delivery => delivery.delivery_id);
            await notificationDelivery.setStatusProcessing(processingDeliveriesId);
            return pendingDeliveries;
        });
    }
}