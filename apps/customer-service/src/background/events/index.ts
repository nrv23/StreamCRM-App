import { parentPort } from "node:worker_threads";
import { OutboxPublisherWorker } from "./event-worker.js";
import { PublishPendingEventsUseCase } from "../../services/Publisher.service.js";
import { OutboxEventRepository } from "../../repository/customer/outbox_event-repository.repository.js";
import { ConsoleEventPublisher } from "../../publisher/ConsoleEvent.publisher.js";

const repository = new OutboxEventRepository();
const publisher = new ConsoleEventPublisher();

const useCase = new PublishPendingEventsUseCase(
    repository,
    publisher,
);

const worker = new OutboxPublisherWorker(
    useCase,
    5000,
    50
);

worker.start();

parentPort?.on("message", (message: unknown) => {
    if (message === "stop") {
        worker.stop();
        parentPort?.postMessage("stopped");
    }
});