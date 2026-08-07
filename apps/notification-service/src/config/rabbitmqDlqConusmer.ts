import amqp, {
    type Channel,
    type ChannelModel,
} from 'amqplib';
import { env } from './enviroment.ts';
import { DeadLetterEventService } from '../services/DeadLetterEvent.service.ts';
import { CreateDeadLetterEventDto } from '../dto/deadLetterEvents/create-dead-letter-event.dto.ts';



export class RabbitMQDqlConsumer {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private readonly _exchangeType = 'topic';
    private readonly queueNameDql = 'notification-service.dlq';
    private readonly _exchangeDlq = 'stream-crm.dlx';
    private _deadLetterEventService: DeadLetterEventService;


    constructor(deadLetterEventService: DeadLetterEventService) {
        // agregar un servicio para guardar en db
        this._deadLetterEventService = deadLetterEventService;
    }

    public async connect(): Promise<void> {
        if (this.channel) {
            return;
        }
        const url = `amqp://${env.rabbitmq_host}:${env.rabbitmq_host_port}/`;
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        console.log('[RabbitMQ DLQ Consumer] Connected.');
    }
    public async getChannel(): Promise<Channel> {
        if (!this.channel) {
            throw new Error(
                '[RabbitMQ DLQ Consumer] Channel is not initialized.',
            );
        }


        // conectar con la cola dlq 
        await this.channel.assertExchange(this._exchangeDlq, this._exchangeType, { durable: true });

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
                '[RabbitMQ DLQ Consumer] Channel is not initialized.',
            );
        }

        await channel.consume(
            this.queueNameDql,
            async (message) => {
                if (!message) {
                    return;
                }

                try {
                    const event = JSON.parse(
                        message.content.toString('utf8'),
                    )

                    console.log(
                        '[DLQ CONSUMER] Event received: ewqe',
                        message.fields.routingKey,
                        event,
                        message.properties.headers
                    );
                    /*

                        [DLQ CONSUMER] Event received: ewqe customer.created {
                        id: 81,
                        event_id: 'cb3427c2-9722-4ec6-95aa-56811947871c',
                        event_name: 'customer.created',
                        aggregate_type: 'customer',
                        aggregate_id: 60,
                        payload: {
                            email: 'pefaf63041@da1voqq31ewqe11pa.com',
                            phone: '32423423423422333',
                            country: 'CR',
                            user_id: 18,
                            lastName: 'test finals',
                            firstName: 'test final',
                            customerId: 60
                        },
                        headers: { source: 'customer_service', version: 1 },
                        retry_count: 0,
                        created_at: '2026-08-07T02:13:59.178Z'
                        } { 'x-application-error': 'error test' }


                    */

                    const isEventExists = await this._deadLetterEventService.find(event.event_id);

                    if (isEventExists > 0) channel.ack(message);
                    else {

                        await this._deadLetterEventService.save({
                            service_name: event.headers.source,
                            queue_name: 'notification-service',
                            exchange: message.fields.exchange,
                            routing_key: message.fields.routingKey,
                            event_id: event.event_id,
                            event_name: event.event_name,
                            payload: event.payload,
                            headers: message.properties.headers || {},
                            reason: message?.properties?.headers && message?.properties?.headers['x-application-error'] || 'unkown reason'
                        });

                        channel.ack(message);
                    }


                } catch (error) {
                    console.error(
                        '[DLQ CONSUMER] Event processing failed:',
                        error,
                    );

                    channel.nack(
                        message,
                        false,
                        false
                    );
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

export default RabbitMQDqlConsumer;