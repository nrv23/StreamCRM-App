import { RabbitDeadLetterEventDlqConsumer } from "../consumer/RabbitDeadLetterEvent.consumer.ts";

export class DlqConsumerService {

    private _rabbitDlqEvent: RabbitDeadLetterEventDlqConsumer;

    constructor(rabbitDlqEvent: RabbitDeadLetterEventDlqConsumer) {
        this._rabbitDlqEvent = rabbitDlqEvent
    }

    async execute() {
        return await this._rabbitDlqEvent.consume();
    }
}