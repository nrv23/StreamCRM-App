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


                    //await this._deadLetterEventService.save({

                    //})


                    // channel.ack(message);


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