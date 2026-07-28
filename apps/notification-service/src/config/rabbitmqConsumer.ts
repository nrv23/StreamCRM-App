import amqp, {
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
} from 'amqplib';
import { env } from './enviroment.ts';


export class RabbitMQConsumer {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private static _instance?: RabbitMQConsumer | null = null;
    private readonly _exchange = 'stream-crm.topic';
    private readonly _exchangeType = 'topic';
    private readonly queueName = 'notification-service';
    static getInstance(): RabbitMQConsumer {
        if (!RabbitMQConsumer._instance) {
            RabbitMQConsumer._instance = new RabbitMQConsumer();
        }

        return RabbitMQConsumer._instance;
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

        await this.channel.assertExchange(
            this._exchange,
            this._exchangeType,
            {
                durable: true,
            },
        );

        await this.channel.assertQueue(
            this.queueName,
            {
                durable: true,
            },
        );

        await this.channel.bindQueue(
            this.queueName,
            this._exchange,
            'customer.#', // binding key indica a rabbit que cualquier evento con un routing key con un patron como este 
            // se va a la cola en la variable queueName.
            // si la cola no existe, rabbit la crea
        );

        await this.channel.prefetch(10);

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
                    ) as Record<string, unknown>;

                    console.log(
                        '[CONSUMER] Event received:',
                        message.fields.routingKey,
                        event,
                    );

                    channel.ack(message);


                } catch (error) {
                    console.error(
                        '[CONSUMER] Event processing failed:',
                        error,
                    );

                    channel.nack(
                        message,
                        false,
                        true,
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

export const rabbitConsumer = RabbitMQConsumer.getInstance();