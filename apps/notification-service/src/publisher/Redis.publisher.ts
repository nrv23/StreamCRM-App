
import { RedisClientType } from "redis";
import { IRedisPublisher } from "../interfaces/publisher/RedisPublisher.interface.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";


export class RedisPublisher implements IRedisPublisher {

    constructor(
        private readonly client: RedisClientType,
        private readonly logger: Logger
    ) { }

    async publish<T>(
        channel: string,
        data: T
    ): Promise<void> {

        await this.client.publish(
            channel,
            JSON.stringify(data)
        );

        const log: ILogMetadata = {
            created_at: new Date().toISOString(),
            payload: data as JsonObject,
            service: "redis-publisher"
        }
        this.logger.info('redis message published', log);
    }
}