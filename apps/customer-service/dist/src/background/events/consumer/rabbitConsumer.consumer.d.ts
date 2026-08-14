import { type Channel } from 'amqplib';
export declare class RabbitMQConsumer {
    private connection;
    private channel;
    private static _instance?;
    private readonly _exchange;
    private readonly _exchangeType;
    private readonly queueName;
    static getInstance(): RabbitMQConsumer;
    connect(): Promise<void>;
    getChannel(): Promise<Channel>;
    consume(channel: Channel): Promise<void>;
    start(): Promise<void>;
}
export declare const rabbitConsumer: RabbitMQConsumer;
//# sourceMappingURL=rabbitConsumer.consumer.d.ts.map