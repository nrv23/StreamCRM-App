
import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.ts";
import { createOutboxEventDto } from './../../dto/outboxEvents/createOutboxEvent.dto.ts'

export interface IOutboxEventsRepository {
    save(event: createOutboxEventDto): Promise<OutBoxEvent>;
    findPending(limit: number): Promise<OutBoxEvent[]>;
    markAsPublished(
        eventId: number,
    ): Promise<void>;
    markAsFailed(
        eventId: string,
        error: string,
    ): Promise<void>;
}