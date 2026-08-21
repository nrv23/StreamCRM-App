import { RedisClientType } from "redis";
import { Logger } from "winston";

import { IRedisSubscriber } from "../interfaces/consumer/redis-subscriber.interface.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";


export class RedisSubscriber<T extends JsonObject>
    implements IRedisSubscriber<T> {

    constructor(
        private readonly client: RedisClientType,
        private readonly logger: Logger
    ) { }


    async subscribe(
        channel: string,
        handler: (message: T) => Promise<void> | void
    ): Promise<void> {

        await this.client.subscribe(
            channel,
            async (response: string) => {

                try {

                    /*
                     * Redis Pub/Sub entrega strings.
                     * Aquí reconstruimos nuestro contrato de aplicación.
                     */
                    const message = JSON.parse(response) as T;


                    const log: ILogMetadata = {
                        created_at: new Date().toISOString(),
                        payload: message,
                        service: "redis-subscriber"
                    };


                    this.logger.info(
                        "redis message received",
                        log
                    );


                    await handler(message);

                } catch (error) {

                    this.logger.error(
                        "Error processing Redis message",
                        {
                            created_at: new Date().toISOString(),
                            payload: {
                                channel,
                                raw_message: response
                            },
                            service: "redis-subscriber",
                            error
                        }
                    );
                }
            }
        );
    }
}