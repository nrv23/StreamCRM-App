import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";

export interface EventPublisher {
    publish(event: OutBoxEvent): Promise<void>;
}