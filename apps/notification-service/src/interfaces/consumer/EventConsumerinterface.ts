import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.ts";

export interface EventConsumer {
    consume(event: OutBoxEvent): Promise<boolean>;
}