export class PublishPendingEventsUseCase {
    _outboxRepository;
    _eventPublisher;
    constructor(outboxRepository, eventPublisher) {
        this._outboxRepository = outboxRepository;
        this._eventPublisher = eventPublisher;
    }
    async execute(limit) {
        const events = await this._outboxRepository.findPending(limit);
        if (!events.length)
            return false;
        for (const event of events) {
            try {
                await this._eventPublisher.publish(event);
                await this._outboxRepository.markAsPublished(event.id);
            }
            catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : "Unknown publisher error";
                console.log("error");
                console.log({ event });
                await this._outboxRepository.markAsFailed(event.event_id, message);
            }
        }
        return true;
    }
}
//# sourceMappingURL=Publisher.service.js.map