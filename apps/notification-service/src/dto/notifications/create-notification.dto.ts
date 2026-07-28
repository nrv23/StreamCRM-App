import { JsonObject } from "../outboxEvents/createOutboxEvent.dto.ts";

export interface CreateNotificationDto {
    external_id: string;
    eventId: string;
    eventName: string;
    userId: number | null;
    title: string;
    message: string;
    type: string;
    status: string;
    metadata: JsonObject;
}