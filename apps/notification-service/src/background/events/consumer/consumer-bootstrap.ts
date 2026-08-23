import { env } from "../../../config/enviroment.ts";
import RabbitMQConsumer from "../../../config/rabbitmqConsumer.ts";
import { RedisBootstrap } from "../../../config/redis.ts";
import { RabbitEventConsumer } from "../../../consumer/RabbitEvent.consumer.ts";
import { EventDispatcher } from "../../../handlers/EventDispatcher.ts";
import { handlers } from "../../../handlers/handlers.ts";
import { ProcessIntegrationEvent } from "../../../handlers/processIntegrationEvent.handler.ts";
import { ProcessedEventRepository } from "../../../repository/processedEvent/processedEvent-repository.repository.ts";
import { ConsumePendingEventsUseCase } from "../../../services/Consumer.service.ts";
import { WinstonLogger } from "../../../shared/utils/winstonLogger.ts";


async function startWorker() {
    try {

        await RedisBootstrap.getInstance().init();
        const repository = new ProcessedEventRepository();
        const dispatcher = new EventDispatcher(handlers)
        const processIntegrationEvent = new ProcessIntegrationEvent(repository, dispatcher)
        const rabbitConsumer = new RabbitMQConsumer(processIntegrationEvent,
            WinstonLogger.getInstance(
                env.elastic_search_url,
                'consumer-boostrap',
                'debug',
                env.index_elastic_search_name
            ))
        const eventConsumer = new RabbitEventConsumer(rabbitConsumer);
        new ConsumePendingEventsUseCase(eventConsumer).execute();

        // generar un metodo que cargue todo de forma secuencial.
    } catch (error) {
        console.error(
            "[CONSUMER EVENT] Failed to initialize:",
            error,
        );

        throw error;
    }
}

void startWorker();