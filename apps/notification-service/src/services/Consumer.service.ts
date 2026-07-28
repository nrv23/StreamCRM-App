import RabbitMQConsumer from "../config/rabbitmqConsumer.ts";

export class ConsumePendingEventsUseCase {

    private _rabbitMQConsumer: RabbitMQConsumer

    constructor(
        rabbitMQConsumer: RabbitMQConsumer
    ) {
        this._rabbitMQConsumer = rabbitMQConsumer;
    }

    async execute(): Promise<void> {
        console.log("llego")
        await this._rabbitMQConsumer.connect();
        const channel = await this._rabbitMQConsumer.getChannel();
        await this._rabbitMQConsumer.consume(channel);
    }
}