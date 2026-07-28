import { JsonObject } from "../dto/outboxEvents/createOutboxEvent.dto.ts";

export class NotificationEntity {
    constructor(
        public _id: number | null,
        public external_id: string,
        public eventId: string,
        public userId: number | null,
        public title: string,
        public message: string,
        public type: string,
        public status: string,
        public metadata: JsonObject,
        public created_at: Date,
        public read_at?: Date | null,
    ) { }
}