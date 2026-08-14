export class ConsoleEventPublisher {
    async publish(event) {
        console.log(`[OUTBOX] Publishing ${event.event_name}`, event.payload);
        return true;
    }
}
//# sourceMappingURL=ConsoleEvent.publisher.js.map