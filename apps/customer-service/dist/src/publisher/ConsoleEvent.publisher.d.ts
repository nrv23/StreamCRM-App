import { OutBoxEvent } from "../entity/OutBoxEvent.entity.js";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.js";
export declare class ConsoleEventPublisher implements EventPublisher {
    publish(event: OutBoxEvent): Promise<boolean>;
}
//# sourceMappingURL=ConsoleEvent.publisher.d.ts.map