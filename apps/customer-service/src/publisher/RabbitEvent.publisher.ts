import { RabbitMQClient, rabbitMQClient } from "../config/raabbitmq.ts";
import { OutBoxEvent } from "../entity/OutBoxEvent.entity.ts";
import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.ts";


export class RabbitEventPublisher implements EventPublisher {

    private _rabbitClient: RabbitMQClient;

    constructor() {
        this._rabbitClient = rabbitMQClient;
    }

    async publish(event: OutBoxEvent): Promise<boolean> {

        return await this._rabbitClient.publish<OutBoxEvent>(event.event_name!, event)
    }
}