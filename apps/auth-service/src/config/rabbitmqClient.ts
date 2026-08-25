import amqp, {
    Options,
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
    private _drainPromise: Promise<void> | null = null;

    private constructor() { }

    static getInstance(): RabbitMQClient {
        if (!RabbitMQClient._instance) {
            RabbitMQClient._instance = new RabbitMQClient();
        }

        return RabbitMQClient._instance;
    }



    async publish<T>(
        routingKey: string,
        payload: T,
    ): Promise<boolean> {
        const channel = this._channel;

        if (!channel) {
            throw new Error(
                '[RabbitMQ] Cannot publish: channel is not initialized.',
            );
        }

        const message = this.serializePayload<T>(payload);

        const options: Options.Publish = {
            persistent: true,
            contentType: 'application/json',
            contentEncoding: 'utf-8',
            timestamp: Date.now(),
            type: routingKey,
        };

        let canContinuePublishing = true;

        /*
         * El callback pertenece específicamente a este mensaje.
         *
         * Esto es mejor que llamar waitForConfirms() después de cada
         * publicación, especialmente si existen publicaciones concurrentes
         * utilizando el mismo ConfirmChannel.
         */

        /*
            el brokerConfirmation si llega al resolve quiere decir qye el mensaje si fue coinfirmado por rabbitmq, 
            si da error pues no. Esa es una,la otra confirm es para manejar el backpressure


        */
        const brokerConfirmation = new Promise<void>((resolve, reject) => {
            canContinuePublishing = channel.publish(
                this._exchange,
                routingKey,
                message,
                options,
                (error) => {
                    if (error) {
                        reject(
                            new Error(
                                `[RabbitMQ] Broker rejected event "${routingKey}".`,
                                { cause: error },
                            ),
                        );

                        return;
                    }

                    resolve(); // mensaje confirmado por rabbitmq
                },
            );
        });

        /*
         * El mensaje ya fue aceptado por el buffer.
         * false solo indica que no debemos publicar más
         * hasta que el channel emita "drain".
         * para manejar el backpressure
         */
        if (!canContinuePublishing) {
            console.warn(
                `[RabbitMQ] Backpressure detected → key: "${routingKey}".`,
            );

            await this.waitForDrain(channel);
        }

        /*
         * Esperamos la confirmación específica de este mensaje.
         */
        await brokerConfirmation;

        console.log(
            `[RabbitMQ] Event confirmed → key: "${routingKey}".`,
        );
        return true;
    }

    private serializePayload<T>( //convierte el mensaje en buffer para poder enviarlo
        payload: T,
    ): Buffer {
        try {
            return Buffer.from(
                JSON.stringify(payload),
                'utf8',
            );
        } catch (error) {
            throw new Error(
                '[RabbitMQ] Failed to serialize event payload.',
                { cause: error },
            );
        }
    }

    private waitForDrain(
        channel: ConfirmChannel,
    ): Promise<void> {
        /*
         * Si otra publicación ya está esperando que el mismo channel
         * se drene, reutilizamos esa promesa.
         */
        if (this._drainPromise) {
            return this._drainPromise;
        }

        this._drainPromise = new Promise<void>((resolve, reject) => {
            const cleanup = (): void => {
                channel.off('drain', handleDrain);
                channel.off('close', handleClose);
                channel.off('error', handleError);
            };

            const handleDrain = (): void => {
                cleanup();

                console.log(
                    '[RabbitMQ] Channel drained. Publication can continue.',
                );

                resolve();
            };

            const handleClose = (): void => {
                cleanup();

                reject(
                    new Error(
                        '[RabbitMQ] Channel closed while waiting for drain.',
                    ),
                );
            };

            const handleError = (error: Error): void => {
                cleanup();

                reject(
                    new Error(
                        '[RabbitMQ] Channel failed while waiting for drain.',
                        { cause: error },
                    ),
                );
            };

            channel.once('drain', handleDrain);
            channel.once('close', handleClose);
            channel.once('error', handleError);
        }).finally(() => {
            this._drainPromise = null;
        });

        return this._drainPromise;
    }

    async connect(): Promise<void> {
        if (this._connection && this._channel) {
            return;
        }

        const url = `amqp://${env.rabbitmq_user}:${env.rabbitmq_password}@${env.rabbitmq_host}:${env.rabbitmq_host_port}${env.rabbitmq_vhost}`;
        console.log({ url })
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