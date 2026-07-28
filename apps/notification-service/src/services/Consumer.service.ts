
import { RabbitEventConsumer } from "../consumer/RabbitEvent.consumer.ts";

export class ConsumePendingEventsUseCase {

    private _rabbitEventConsumer: RabbitEventConsumer

    constructor(
        rabbitEventConsumer: RabbitEventConsumer
    ) {
        this._rabbitEventConsumer = rabbitEventConsumer;
    }

    async execute(): Promise<void> {
        await this._rabbitEventConsumer.consume();
    }
}