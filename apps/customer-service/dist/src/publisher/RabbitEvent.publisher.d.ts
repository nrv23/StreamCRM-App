import { OutBoxEvent } from "../entity/OutBoxEvent.entity.ts";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.ts";
export declare class RabbitEventPublisher implements EventPublisher {
    private _rabbitClient;
    constructor();
    publish(event: OutBoxEvent): Promise<boolean>;
}
//# sourceMappingURL=RabbitEvent.publisher.d.ts.map