export declare class RabbitMQClient {
    private static _instance;
    private _connection;
    private _channel;
    private readonly _exchange;
    private readonly _exchangeType;
    private _drainPromise;
    private constructor();
    static getInstance(): RabbitMQClient;
    publish<T>(routingKey: string, payload: T): Promise<boolean>;
    private serializePayload;
    private waitForDrain;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
export declare const rabbitMQClient: RabbitMQClient;
//# sourceMappingURL=raabbitmq.d.ts.map