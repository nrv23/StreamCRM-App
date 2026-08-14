import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { IOutboxEventsRepository } from "../../interfaces/customer/outbox_event-repository.interface.js";
import { createOutboxEventDto } from "../../dto/customer/createOutboxEvent.dto.js";
export declare class OutboxEventRepository implements IOutboxEventsRepository {
    private _db;
    constructor(db?: IDatabase);
    markAsPublished(eventId: number): Promise<void>;
    markAsFailed(eventId: string, error: string): Promise<void>;
    save(event: createOutboxEventDto): Promise<OutBoxEvent>;
    findPending(limit: number): Promise<OutBoxEvent[]>;
}
//# sourceMappingURL=outbox_event-repository.repository.d.ts.map