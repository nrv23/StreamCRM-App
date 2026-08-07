import amqp, {
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
} from 'amqplib';
import { env } from './enviroment.ts';
import { ProcessIntegrationEvent } from '../handlers/processIntegrationEvent.handler.ts';
import { randomUUID } from 'node:crypto';
import { RabbitEventDto } from '../dto/outboxEvents/rabbitEvent.dto.ts';


export class RabbitMQConsumer {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly _exchange = 'stream-crm.topic';
    private readonly _exchangeType = 'topic';
    private readonly queueName = 'notification-service';
    private readonly queueNameDql = 'notification-service.dlq';
    private readonly _exchangeDlq = 'stream-crm.dlx';

    private readonly _processIntegrationEvent: ProcessIntegrationEvent;

    constructor(processIntegrationEvent: ProcessIntegrationEvent) {
        this._processIntegrationEvent = processIntegrationEvent;
    }

    public async connect(): Promise<void> {
        if (this.channel) {
            return;
        }
        const url = `amqp://${env.rabbitmq_host}:${env.rabbitmq_host_port}/`;
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        console.log('[RabbitMQ Consumer] Connected.');
    }
    public async getChannel(): Promise<Channel> {
        if (!this.channel) {
            throw new Error(
                '[RabbitMQ Consumer] Channel is not initialized.',
            );
        }

        // configurar el consumidor

        await this.channel.assertExchange(
            this._exchange,
            this._exchangeType,
            {
                durable: true,
            },
        );

        // conectar con la cola dlq 
        await this.channel.assertExchange(this._exchangeDlq, this._exchangeType, { durable: true });



        await this.channel.assertQueue(
            this.queueName,
            {
                durable: true,
                arguments: {
                    // aqui rabbit indica a cual cola dlq enviar si hay un error
                    "x-dead-letter-exchange": this._exchangeDlq,
                }
            },
        );

        await this.channel.bindQueue(
            this.queueName,
            this._exchange,
            'customer.#'
        );


        // cola dql 

        await this.channel.assertQueue(
            this.queueNameDql,
            {
                durable: true,
            },
        );

        // vincular cola dlq
        await this.channel.bindQueue(
            this.queueNameDql,
            this._exchangeDlq,
            'customer.#'
        );


        // precargar lista limitada de mensajes
        await this.channel.prefetch(20); // envia 20 mensajes y conforme se van confirmado los mensajes va enviando uno a uno

        return this.channel;
    }

    public async consume(channel: Channel) {

        if (!channel) {
            throw new Error(
                '[RabbitMQ Consumer] Channel is not initialized.',
            );
        }

        await channel.consume(
            this.queueName,
            async (message) => {
                if (!message) {
                    return;
                }

                try {
                    const event = JSON.parse(
                        message.content.toString('utf8'),
                    )

                    console.log(
                        '[CONSUMER] Event received: ewqe',
                        message.fields.routingKey,
                        event,
                    );
                    /*

                        id: 4,
                        event_id: '50564314-6554-47b1-892c-abc0d2a6a44d',
                        event_name: 'customer.created',
                        aggregate_type: 'customer',
                        aggregate_id: 19,
                        payload: {
                            email: 'correo12671231111sdasdasdsadsd1@test.com',
                            phone: '123456784',
                            country: 'DO',
                            customerId: 19
                        },
                        headers: { source: 'customer-service', version: '1' },
                        retry_count: 0,
                        created_at: '2026-07-07T06:41:46.571Z'

                    */


                    const rabbitEvent: RabbitEventDto = {
                        external_id: randomUUID(),
                        aggregate_id: event.aggregate_id,
                        aggregate_type: event.aggregate_type,
                        event_id: event.event_id,
                        event_name: event.event_name,
                        user_id: event.payload.user_id,
                        payload: event.payload,
                        headers: event.headers,
                    }

                    if (rabbitEvent.payload.phone) throw new Error('error test') //channel.reject(message, false);  // Al poner false, RabbitMQ desvía automáticamente el mensaje al DLX
                    else {
                        await this._processIntegrationEvent.execute(rabbitEvent);
                        channel.ack(message);
                    }


                } catch (error) {


                    console.error(
                        '[CONSUMER] Event processing failed:',
                        error,
                    );

                    try {
                        const reason =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        const headers = {
                            ...(message.properties.headers ?? {}),
                            'x-application-error': reason,
                        };

                        const published = channel.publish(
                            this._exchangeDlq,
                            message.fields.routingKey,
                            message.content,
                            {
                                ...message.properties,
                                headers,
                                persistent: true,
                            },
                        );

                        if (!published) {
                            throw new Error(
                                'Could not publish failed message to DLX',
                            );
                        }

                        // Como nosotros mismos republicamos el mensaje al DLX,
                        // confirmamos el mensaje original para que no vuelva
                        // a la cola principal.
                        channel.ack(message);

                        console.log(
                            '[CONSUMER] Event manually published to DLQ:',
                            {
                                routingKey: message.fields.routingKey,
                                reason,
                            },
                        );

                    } catch (dlqError) {
                        console.error(
                            '[CONSUMER] Failed to publish message to DLQ:',
                            dlqError,
                        );

                        /*
                         * IMPORTANTE:
                         * no hacemos ACK del mensaje original.
                         *
                         * Si el canal/proceso se cierra, RabbitMQ
                         * volverá a ponerlo disponible en la cola principal.
                         */
                    }
                }
            },
            {
                noAck: false,
            },
        );
    }

    public async start(): Promise<void> {
        await this.connect();
        const channel = await this.getChannel();
        await this.consume(channel);
    }
}

export default RabbitMQConsumer;