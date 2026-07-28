import { RabbitMQConsumer } from "../config/rabbitmqConsumer.ts";
import { OutBoxEvent } from "../entity/OutBoxEvent.entity.ts";
import { EventConsumer } from "../interfaces/consumer/EventConsumerinterface.ts";

export class RabbitEventConsumer implements EventConsumer {

    private _rabbitmqConsumer: RabbitMQConsumer;
    constructor(rabbitmqConsumer: RabbitMQConsumer) {
        this._rabbitmqConsumer = rabbitmqConsumer;
    }

    async consume(): Promise<void> {
        console.log("llego")
        await this._rabbitmqConsumer.connect();
        const channel = await this._rabbitmqConsumer.getChannel();
        await this._rabbitmqConsumer.consume(channel);
    }
}