import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";
export interface EventPublisher {
    publish(event: OutBoxEvent): Promise<boolean>;
}
//# sourceMappingURL=EventPublisher.interface.d.ts.map