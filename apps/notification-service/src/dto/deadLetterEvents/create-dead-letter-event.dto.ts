import { JsonObject } from "../outboxEvents/createOutboxEvent.dto.ts";


export interface CreateDeadLetterEventDto {

    service_name: string;
    queue_name: string;
    exchange: string;
    routing_key: string;
    event_id: string;
    event_name: string;
    payload: JsonObject;
    headers: JsonObject;
    reason: string;
}