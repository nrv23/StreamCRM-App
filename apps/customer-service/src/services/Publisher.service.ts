import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.js";
import { OutboxEventRepository } from "../repository/customer/outbox_event-repository.repository.js";

export class PublishPendingEventsUseCase {
    constructor(
        private readonly outboxRepository: OutboxEventRepository,
        private readonly eventPublisher: EventPublisher,
    ) { }

    async execute(limit = 100): Promise<void> {
        const events = await this.outboxRepository.findPending(limit);

        for (const event of events) {
            try {
                await this.eventPublisher.publish(event);

                await this.outboxRepository.markAsPublished(
                    event.id,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unknown publisher error";

                await this.outboxRepository.markAsFailed(
                    event.id,
                    message,
                );
            }
        }
    }
}