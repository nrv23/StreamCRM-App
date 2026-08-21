import { JsonObject } from "../../dto/outboxEvents/createOutboxEvent.dto.ts";


export interface IRedisSubscriber<T extends JsonObject> {
    subscribe(
        channel: string,
        handler: (message: T) => Promise<void> | void
    ): Promise<void>
}