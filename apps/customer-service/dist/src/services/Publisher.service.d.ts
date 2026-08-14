import { IOutboxEventsRepository } from "../interfaces/customer/outbox_event-repository.interface.ts";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.js";
export declare class PublishPendingEventsUseCase {
    private readonly _outboxRepository;
    private readonly _eventPublisher;
    constructor(outboxRepository: IOutboxEventsRepository, eventPublisher: EventPublisher);
    execute(limit: number): Promise<boolean>;
}
//# sourceMappingURL=Publisher.service.d.ts.map