import { rabbitConsumer, RabbitMQConsumer } from "../config/rabbitmqConsumer.ts";
import { OutBoxEvent } from "../entity/OutBoxEvent.entity.ts";
import { EventConsumer } from "../interfaces/consumer/EventConsumerinterface.ts";

export class RabbitEventConsumer implements EventConsumer {

    private _rabbitmqConsumer: RabbitMQConsumer;
    constructor() {
        this._rabbitmqConsumer = rabbitConsumer;
    }

    consume(event: OutBoxEvent): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}