import { SocketServer } from "../config/socketio.ts"
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { CHANGE_CUSTOMER_STATUS, CREATE_TAG, DELETE_CUSTOMER, SOCKET_EMMIT, UPDATE_CUSTOMER } from "../shared/types/events.type..ts";
import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";
import { parentPort } from "node:worker_threads";

export type SocketPayload = {
    message: string;
    data: JsonObject;
}

export type SocketMessage = {
    event: string;
    type: string;
    room: string;
    payload: SocketPayload
}

export class SocketPublisher implements ISocketPublisher {

    private _logger: Logger;
    constructor(
        logger: Logger
    ) {
        this._logger = logger;

    }

    public async publish(deliveries: GetNotificationDeliveriesResponse[]) {
        let log: ILogMetadata;
        for (const delivery of deliveries) {
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

            if (!payload) continue; // continue con la siguiente iteracion

            //room, delivery.metadata.event!.toString()
            const room = `user:${delivery.metadata.user_id!.toString()}`;
            const socketMessage: SocketMessage = {
                event: SOCKET_EMMIT,
                type: "socket",
                room,
                payload: payload
            }
            this._logger.info('Notification was sent using socket...', log);

            parentPort?.postMessage(socketMessage);


        }
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


}