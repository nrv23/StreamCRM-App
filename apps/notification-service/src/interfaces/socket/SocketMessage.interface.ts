import { JsonObject } from "../../dto/outboxEvents/createOutboxEvent.dto.ts";

export type SocketPayload = {
    message: string;
    data: JsonObject;
}

export type SocketMessage = {
    event: string;
    type: string;
    room: string;
    payload: SocketPayload
}
