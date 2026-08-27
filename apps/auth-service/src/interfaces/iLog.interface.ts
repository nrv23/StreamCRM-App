import { JsonObject } from "../dto/event/create-event.dto.ts";


export interface ILogMetadata {
    service: string;
    event?: string;
    event_id?: string;
    entity_id?: number;
    method?: string;
    payload?: JsonObject;
    created_at: string;
    error_name?: string;
    error_message?: string;
    error_stack?: string;
}