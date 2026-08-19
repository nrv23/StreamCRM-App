import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { SOCKET_EMMIT } from "../shared/types/events.type..ts";
import { ISocketPublisher } from "../interfaces/publisher/SocketPublisher.interface.ts";
import { parentPort } from "node:worker_threads";
import { SocketPayloadFactory } from "../shared/factory/socket-payload-factory.ts";
import { SocketMessage } from "../interfaces/socket/SocketMessage.interface.ts";


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
            console.log({ delivery });
            log = {
                service: env.service_name,
                created_at: new Date().toISOString(),
                entity_id: delivery.delivery_id,
                event: delivery.channel,
                event_id: delivery.notification_external_id,
                payload: JSON.parse(JSON.stringify(delivery.metadata))
            };

            const payload = SocketPayloadFactory.build(delivery);
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
}