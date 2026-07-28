import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.ts";

export interface IntegrationEventHandler {
    handle(event: OutBoxEvent): Promise<void>;
}
