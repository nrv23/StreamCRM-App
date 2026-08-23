import { Emitter } from "@socket.io/redis-emitter";
import { IRedisEmitter } from "../interfaces/publisher/RedisEmitter.publisher.ts";
import { SocketMessage } from "../interfaces/socket/SocketMessage.interface.ts";
import { RedisClientType } from "redis";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";
import { GetNotificationDeliveriesResponse } from "../repository/notification/notification-delivery-repository.repository.ts";
import { SocketPayloadFactory } from "../shared/factory/socket-payload-factory.ts";
import { SOCKET_EMMIT } from "../shared/types/events.type..ts";

export class RedisEmitter implements IRedisEmitter {

    private _emitter: Emitter;
    private _namespace: string = '/notifications';
    private _logger: Logger;

    constructor(public readonly redisClient: RedisClientType, logger: Logger) {
        this._emitter = new Emitter(redisClient);
        this._logger = logger;
    }

    emit(payload: GetNotificationDeliveriesResponse): void {

        const log: ILogMetadata = {
            service: env.service_name,
            created_at: new Date().toISOString(),
            event: payload.metadata.event!.toString(),
            payload: {
                ...payload.metadata as JsonObject
            }
        }
        this._logger.info('Emitting message ....', log);

        const messagePayload = SocketPayloadFactory.build(payload);
        if (!messagePayload) return;

        //room, delivery.metadata.event!.toString()
        const room = `user:${payload.metadata.user_id!.toString()}`;
        const socketMessage: SocketMessage = {
            event: SOCKET_EMMIT,
            type: "socket",
            room,
            payload: messagePayload
        }
        this._emitter
            .of(this._namespace)
            .to(room)
            .emit(payload.metadata.event!.toString(), socketMessage);

        this._logger.info('Message emitted ....', log);
    }
}