import amqp, {
    type ChannelModel,
    type ConfirmChannel,
} from 'amqplib';

import { env } from './enviroment.js';

export class RabbitMQClient {
    private static _instance: RabbitMQClient | null = null;

    private _connection: ChannelModel | null = null;
    private _channel: ConfirmChannel | null = null;

    private readonly _exchange = 'stream-crm.topic';
    private readonly _exchangeType = 'topic';

    private constructor() { }

    static getInstance(): RabbitMQClient {
        if (!RabbitMQClient._instance) {
            RabbitMQClient._instance = new RabbitMQClient();
        }

        return RabbitMQClient._instance;
    }

    async connect(): Promise<void> {
        if (this._connection && this._channel) {
            return;
        }

        const url =
            `amqp://${env.rabbitmq_host}:${env.rabbitmq_host_port}`;

        try {
            const connection = await amqp.connect(url);
            const channel = await connection.createConfirmChannel();

            await channel.assertExchange(
                this._exchange,
                this._exchangeType,
                {
                    durable: true,
                },
            );

            this._connection = connection;
            this._channel = channel;

            connection.on('close', () => {
                console.warn(
                    '[RabbitMQ] Connection closed unexpectedly.',
                );

                this._connection = null;
                this._channel = null;
            });

            connection.on('error', (error: Error) => {
                console.error(
                    '[RabbitMQ] Connection error:',
                    error.message,
                );
            });

            channel.on('close', () => {
                console.warn('[RabbitMQ] Channel closed.');

                this._channel = null;
            });

            channel.on('error', (error: Error) => {
                console.error(
                    '[RabbitMQ] Channel error:',
                    error.message,
                );
            });

            console.log(
                `[RabbitMQ] Connected | exchange: "${this._exchange}"`,
            );
        } catch (error: unknown) {
            this._connection = null;
            this._channel = null;

            console.error(
                '[RabbitMQ] Failed to connect:',
                error,
            );

            throw error;
        }
    }

    async publish(
        routingKey: string,
        payload: Record<string, unknown>,
    ): Promise<void> {
        const channel = this._channel;

        if (!channel) {
            throw new Error(
                '[RabbitMQ] Cannot publish: channel is not initialized.',
            );
        }

        const message = Buffer.from(
            JSON.stringify(payload),
            'utf8',
        );

        channel.publish(
            this._exchange,
            routingKey,
            message,
            {
                persistent: true,
                contentType: 'application/json',
                contentEncoding: 'utf-8',
                timestamp: Date.now(),
            },
        );

        /*
         * Espera la confirmación del broker.
         * Solo después de esto el Outbox debería marcarse como published.
         */
        await channel.waitForConfirms();

        console.log(
            `[RabbitMQ] Event confirmed → key: "${routingKey}"`,
        );
    }

    async disconnect(): Promise<void> {
        const channel = this._channel;
        const connection = this._connection;

        /*
         * Se limpian primero para impedir nuevas publicaciones
         * mientras comienza el apagado.
         */
        this._channel = null;
        this._connection = null;

        try {
            if (channel) {
                await channel.close();
            }

            if (connection) {
                await connection.close();
            }

            console.log('[RabbitMQ] Disconnected.');
        } catch (error: unknown) {
            console.error(
                '[RabbitMQ] Error while disconnecting:',
                error,
            );
        }
    }
}

export const rabbitMQClient =
    RabbitMQClient.getInstance();