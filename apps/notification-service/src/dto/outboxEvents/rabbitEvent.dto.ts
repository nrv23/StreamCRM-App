import { JsonObject } from "./createOutboxEvent.dto.ts";

export interface RabbitEventDto {
    external_id: string,
    event_id: string,
    event_name: string,
    aggregate_id: string,
    aggregate_type: string,
    user_id: number,
    payload: JsonObject,
    headers: JsonObject
}