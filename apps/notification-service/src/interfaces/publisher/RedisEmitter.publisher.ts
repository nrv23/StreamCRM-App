import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";
import { SocketMessage } from "../socket/SocketMessage.interface.ts";


export interface IRedisEmitter {

    emit(payload: GetNotificationDeliveriesResponse): void;
}