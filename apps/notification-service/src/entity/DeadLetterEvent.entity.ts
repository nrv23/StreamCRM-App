import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts"
import { DeadLetterEventStatus } from "../enum/DeadLetterEventStatus.enum.ts";

export class DeadLetterEventEntity {

    constructor(
        public readonly id: number,
        public service_name: string,
        public queue_name: string,
        public exchange: string,
        public routing_key: string,
        public event_id: string,
        public event_name: string,
        public payload: JsonObject,
        public headers: JsonObject,
        public reason: string,
        public created_at: Date,
        public status: DeadLetterEventStatus
    ) {

    }
}