
type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject;

export interface JsonObject {
    [key: string]: JsonValue;
}

export interface createEventDto {

    id?: number;
    event_id: string;
    event_name: string;
    aggregate_id: number | BigInt;
    aggregate_type: string;
    payload: JsonObject;
    headers: JsonObject;
}