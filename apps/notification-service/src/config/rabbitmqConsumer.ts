import amqp, {
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
} from 'amqplib';
import { env } from './enviroment.ts';
import { ProcessIntegrationEvent } from '../handlers/processIntegrationEvent.handler.ts';
import { randomUUID } from 'node:crypto';
import { RabbitEventDto } from '../dto/outboxEvents/rabbitEvent.dto.ts';
import { Logger } from 'winston';
import { ILogMetadata } from '../interfaces/iLog.interface.ts';


export class RabbitMQConsumer {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly _exchange = 'stream-crm.topic';
    private readonly _exchangeType = 'topic';
    private readonly queueName = 'notification-service';
    private readonly queueNameDql = 'notification-service.dlq';
    private readonly _exchangeDlq = 'stream-crm.dlx';

    private readonly _processIntegrationEvent: ProcessIntegrationEvent;
    private readonly _logger: Logger;
    constructor(processIntegrationEvent: ProcessIntegrationEvent, logger: Logger) {
        this._processIntegrationEvent = processIntegrationEvent;
        this._logger = logger;
    }

    public async connect(): Promise<void> {
        if (this.channel) {
            return;
        }
        const url = `amqp://${env.rabbitmq_host}:${env.rabbitmq_host_port}/`;
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        console.log('[RabbitMQ Consumer] Connected.');

        const log: ILogMetadata = {
            service: env.service_name,
            created_at: new Date().toISOString()
        }

        this._logger.info('[RabbitMQ Consumer]', log);

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
                    let log: ILogMetadata;
                    const event = JSON.parse(
                        message.content.toString('utf8'),
                    )
                    /*
                    console.log(
                        '[CONSUMER] Event received: ewqe',
                        message.fields.routingKey,
                        event,
                    );*/

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

                    log = {
                        service: env.service_name,
                        event: event.event_name,
                        entity_id: event.payload.customerId,
                        event_id: event.event_id,
                        created_at: event.created_at,
                        payload: event.payload
                    }

                    this._logger.info('[RabbitMQ Consumer] consuming event...', log);

                    await this._processIntegrationEvent.execute(rabbitEvent);

                    channel.ack(message);

                    this._logger.info('[RabbitMQ Consumer] event consumed', log);

                } catch (error) {

                    try {
                        let log: ILogMetadata;
                        let errorObject = {
                            message: "",
                            name: "",
                            stack: ""
                        }
                        const event = JSON.parse(
                            message.content.toString('utf8'),
                        )

                        if (error instanceof Error) {
                            errorObject = {
                                message: error.message,
                                name: error.name,
                                stack: error.stack ?? 'unkown stack trace error'
                            };
                        }
                        else errorObject.message = String(error);
                        // publicar log de error 
                        log = {
                            service: env.service_name,
                            created_at: new Date().toISOString(),
                            error_message: errorObject.message,
                            error_name: errorObject.name,
                            error_stack: errorObject.stack,
                        }
                        this._logger.error('[CONSUMER] Event processing failed:', log);
                        //

                        const headers = {
                            ...(message.properties.headers ?? {}),
                            'x-application-error': errorObject.message,
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

                        log = {
                            service: env.service_name,
                            created_at: new Date().toISOString(),
                            event: event.event_name,
                            entity_id: event.payload.customerId,
                            event_id: event.event_id,
                            payload: JSON.parse(JSON.stringify(message.properties))
                        };

                        this._logger.info('[CONSUMER] Event manually published to DLQ:', log);


                    } catch (dlqError) {

                        const log: ILogMetadata = {
                            payload: dlqError instanceof Error
                                ? JSON.parse(JSON.stringify(dlqError))
                                : { message: String(dlqError) },
                            service: env.service_name,
                            created_at: new Date().toISOString()
                        }
                        this._logger.error('[CONSUMER] Failed to publish message to DLQ:', log);

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