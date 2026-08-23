import { JsonObject } from "../customer/createOutboxEvent.dto.js";


export interface CreateLogDto {
    entity_type: string;
    entity_id: number;
    action: string;
    changed_by_user_id: number;
    old_values?: JsonObject;
    new_values: JsonObject;
    ip_address: string;
    user_agent: string;
}