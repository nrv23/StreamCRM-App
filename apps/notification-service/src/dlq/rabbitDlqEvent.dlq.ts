import RabbitMQDlq from "../config/rabbitmqDlq.ts";



export class RabbitDlqEvent {

    private _rabbitDlqClient: RabbitMQDlq;

    constructor(
        rabbitDlqClient: RabbitMQDlq
    ) {
        this._rabbitDlqClient = rabbitDlqClient;
    }

    async consume(): Promise<void> {
        await this._rabbitDlqClient.connect();
        const channel = await this._rabbitDlqClient.getChannel();
        await this._rabbitDlqClient.consume(channel);
    }
}