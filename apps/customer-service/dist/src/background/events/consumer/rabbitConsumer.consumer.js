import amqp from 'amqplib';
import { env } from "../../../config/enviroment.js";
export class RabbitMQConsumer {
    connection = null;
    channel = null;
    static _instance = null;
    _exchange = 'stream-crm.topic';
    _exchangeType = 'topic';
    queueName = 'notification-service';
    static getInstance() {
        if (!RabbitMQConsumer._instance) {
            RabbitMQConsumer._instance = new RabbitMQConsumer();
        }
        return RabbitMQConsumer._instance;
    }
    async connect() {
        if (this.channel) {
            return;
        }
        const url = `amqp://${env.rabbitmq_host}:${env.rabbitmq_host_port}/`;
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        console.log('[RabbitMQ Consumer] Connected.');
    }
    async getChannel() {
        if (!this.channel) {
            throw new Error('[RabbitMQ Consumer] Channel is not initialized.');
        }
        await this.channel.assertExchange(this._exchange, this._exchangeType, {
            durable: true,
        });
        await this.channel.assertQueue(this.queueName, {
            durable: true,
        });
        await this.channel.bindQueue(this.queueName, this._exchange, 'customer.#');
        await this.channel.prefetch(10);
        return this.channel;
    }
    async consume(channel) {
        await channel.consume(this.queueName, async (message) => {
            if (!message) {
                return;
            }
            try {
                const event = JSON.parse(message.content.toString('utf8'));
                console.log('[CONSUMER] Event received:', message.fields.routingKey, event);
                channel.ack(message);
            }
            catch (error) {
                console.error('[CONSUMER] Event processing failed:', error);
                channel.nack(message, false, true);
            }
        }, {
            noAck: false,
        });
    }
    async start() {
        await this.connect();
        const channel = await this.getChannel();
        await this.consume(channel);
    }
}
export const rabbitConsumer = RabbitMQConsumer.getInstance();
//# sourceMappingURL=rabbitConsumer.consumer.js.map