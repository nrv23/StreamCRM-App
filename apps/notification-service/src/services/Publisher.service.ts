import { IOutboxEventsRepository } from "../interfaces/event/outbox_event-repository.interface.ts";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.js";

export class PublishPendingEventsUseCase {
    private readonly _outboxRepository: IOutboxEventsRepository;
    private readonly _eventPublisher: EventPublisher;
    constructor(
        outboxRepository: IOutboxEventsRepository,
        eventPublisher: EventPublisher
    ) {
        this._outboxRepository = outboxRepository;
        this._eventPublisher = eventPublisher;
    }

    async execute(limit: number): Promise<boolean> {
        const events = await this._outboxRepository.findPending(limit);
        if (!events.length) return false;
        for (const event of events) {
            try {
                await this._eventPublisher.publish(event);
                await this._outboxRepository.markAsPublished(
                    event.id,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unknown publisher error";
                console.log("error");
                console.log({ event })
                await this._outboxRepository.markAsFailed(
                    event.event_id,
                    message,
                );
            }
        }

        return true;
    }
}