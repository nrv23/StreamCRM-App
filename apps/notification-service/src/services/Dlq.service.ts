import { RabbitDlqEvent } from "../dlq/rabbitDlqEvent.dlq.ts";



export class DlqService {

    private _rabbitDlqEvent: RabbitDlqEvent
    constructor(rabbitDlqEvent: RabbitDlqEvent) {
        this._rabbitDlqEvent = rabbitDlqEvent

    }

    async execute() {
        return this._rabbitDlqEvent.consume();
    }
}