import { OutBoxEvent } from "../entity/OutBoxEvent.entity.js";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.js";


export class ConsoleEventPublisher implements EventPublisher {

    async publish(event: OutBoxEvent): Promise<boolean> {
        console.log(
            `[OUTBOX] Publishing ${event.event_name}`,
            event.payload,
        );

        return true;
    }
}