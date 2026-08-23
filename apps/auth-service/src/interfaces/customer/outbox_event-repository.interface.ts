import { createOutboxEventDto } from "../../dto/customer/createOutboxEvent.dto.js";
import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";


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