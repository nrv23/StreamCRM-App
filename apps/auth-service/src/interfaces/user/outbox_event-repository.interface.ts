import { createEventDto } from "../../dto/event/create-event.dto.ts";
import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.ts";


export interface IOutboxEventsRepository {
    save(event: createEventDto): Promise<OutBoxEvent>;
    findPending(limit: number): Promise<OutBoxEvent[]>;
    markAsPublished(
        eventId: number,
    ): Promise<void>;
    markAsFailed(
        eventId: string,
        error: string,
    ): Promise<void>;
}