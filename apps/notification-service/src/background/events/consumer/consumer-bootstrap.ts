import RabbitMQConsumer from "../../../config/rabbitmqConsumer.ts";
import { RabbitEventConsumer } from "../../../consumer/RabbitEvent.consumer.ts";
import { EventDispatcher } from "../../../handlers/EventDispatcher.ts";
import { handlers } from "../../../handlers/handlers.ts";
import { ProcessIntegrationEvent } from "../../../handlers/processIntegrationEvent.handler.ts";
import { ProcessedEventRepository } from "../../../repository/processedEvent/processedEvent-repository.repository.ts";
import { ConsumePendingEventsUseCase } from "../../../services/Consumer.service.ts";


const repository = new ProcessedEventRepository();
const dispatcher = new EventDispatcher(handlers)
const processIntegrationEvent = new ProcessIntegrationEvent(repository, dispatcher)
const rabbitConsumer = new RabbitMQConsumer(processIntegrationEvent)
const eventConsumer = new RabbitEventConsumer(rabbitConsumer);
new ConsumePendingEventsUseCase(eventConsumer).execute();