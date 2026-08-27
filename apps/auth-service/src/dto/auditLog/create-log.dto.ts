import { JsonObject } from "../event/create-event.dto.ts";


export interface CreateLogDto {
    entity_type: string;
    entity_id: number;
    action: string;
    user_id: number;
    old_values?: JsonObject;
    new_values: JsonObject;
    ip_address: string;
    user_agent: string;
}