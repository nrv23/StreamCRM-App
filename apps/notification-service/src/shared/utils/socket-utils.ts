import { SocketMessage } from "../../interfaces/socket/SocketMessage.interface.ts";
import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";
import { SocketPayloadFactory } from "../factory/socket-payload-factory.ts";
import { SOCKET_EMMIT } from "../types/events.type..ts";


export class SocketUtils {


    static buildMessage(data: GetNotificationDeliveriesResponse): SocketMessage | void {

        const payload = SocketPayloadFactory.build(data);
        if (!payload) return; // continue con la siguiente iteracion

        //room, delivery.metadata.event!.toString()
        const room = `user:${data.metadata.user_id!.toString()}`;
        const socketMessage: SocketMessage = {
            event: SOCKET_EMMIT,
            type: "socket",
            room,
            payload: payload
        }

        return socketMessage;
    }
}