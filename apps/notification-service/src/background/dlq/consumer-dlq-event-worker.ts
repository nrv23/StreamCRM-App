import { parentPort, workerData } from "worker_threads";
import { DlqConsumerService } from "../../services/DlqConsumer.service.ts";
import { DeadLetterEventService } from "../../services/DeadLetterEvent.service.ts";
import { RabbitDeadLetterEventDlqConsumer } from "../../consumer/RabbitDeadLetterEvent.consumer.ts";
import RabbitMQDqlConsumer from "../../config/rabbitmqDlqConusmer.ts";
import { DeadLetterEventRepository } from "../../repository/event/dead_letter_event-repository.repository.ts";
import { env } from "../../config/enviroment.ts";
import { WinstonLogger } from "../../shared/utils/winstonLogger.ts";


async function startWoker() {

    try {
        const { } = workerData;

        const repository = new DeadLetterEventRepository();
        const deadLetterEventService = new DeadLetterEventService(repository)
        const rabbitDqlConsumer = new RabbitMQDqlConsumer(deadLetterEventService, WinstonLogger.getInstance(
            env.elastic_search_url,
            'consumer-dlq',
            'debug',
            env.index_elastic_search_name
        ));
        const rabbitDeadLetterEventDlqConsumer = new RabbitDeadLetterEventDlqConsumer(rabbitDqlConsumer)
        const dqlConsumerService = new DlqConsumerService(rabbitDeadLetterEventDlqConsumer);
        await dqlConsumerService.execute();

    } catch (error) {


        const message = error instanceof Error ? error.message : error;

        parentPort?.postMessage({
            message: "There was an error in DLQ Consumer Worker" + message,
            ok: false
        });

        process.exit(1); // se cerro el worker por un error fatal;
    }

}

void startWoker();
