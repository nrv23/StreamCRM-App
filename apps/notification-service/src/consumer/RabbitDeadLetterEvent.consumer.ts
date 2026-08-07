

import RabbitMQDqlConsumer from "../config/rabbitmqDlqConusmer.ts";
import { EventConsumer } from "../interfaces/consumer/EventConsumerinterface.ts";

export class RabbitDeadLetterEventDlqConsumer implements EventConsumer {

    private _rabbitmqDlqConsumer: RabbitMQDqlConsumer;
    constructor(rabbitmqDlqConsumer: RabbitMQDqlConsumer) {
        this._rabbitmqDlqConsumer = rabbitmqDlqConsumer;
    }

    async consume(): Promise<void> {
        await this._rabbitmqDlqConsumer.connect();
        const channel = await this._rabbitmqDlqConsumer.getChannel();
        await this._rabbitmqDlqConsumer.consume(channel);
    }
}