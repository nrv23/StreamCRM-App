import { parentPort, workerData } from "node:worker_threads";
import { OutboxEventRepository } from "../../repository/customer/outbox_event-repository.repository.js";
import { env } from "../../config/enviroment.js";
import { PublishPendingEventsUseCase } from "../../services/Publisher.service.js";
import { RabbitEventPublisher } from "../../publisher/RabbitEvent.publisher.js";
import { rabbitMQClient } from "../../config/raabbitmq.js";
//import './consumer/consumer-bootstrap.ts';
export class OutboxPublisherWorker {
    timer;
    isStopping = false;
    workerEventPublisherService;
    intervalMs;
    limit;
    constructor(workerEventPublisherService, intervalMs = 5000, limit) {
        this.workerEventPublisherService = workerEventPublisherService;
        this.intervalMs = intervalMs;
        this.limit = limit;
    }
    start() {
        console.log(`[OUTBOX WORKER] Iniciado. Polling cada ${this.intervalMs}ms...`);
        void this.loop();
    }
    async loop() {
        if (this.isStopping)
            return;
        try {
            // cambiar aqui el mensaje segun lo que retorne
            const hasEventProccesed = await this.workerEventPublisherService.execute(this.limit);
            if (hasEventProccesed) {
                parentPort?.postMessage({
                    message: "Events batch processed successfully",
                    ok: true
                });
            }
            else {
                parentPort?.postMessage({
                    message: "No pending events was found",
                    ok: true
                });
            }
        }
        catch (error) {
            console.error("[OUTBOX WORKER] Error detectado. Apagando worker...", error);
            // 1. Notificamos al hilo principal
            parentPort?.postMessage({
                message: "Outbox worker failed: " + error.message,
                ok: false
            });
            // 2. Detenemos el worker para que no vuelva a ejecutar otra tanda
            this.stop();
        }
        finally {
            // Si hubo error, this.stop() puso isStopping = true,
            // por lo que el if es falso y el thread muere limpiamente acá.
            if (!this.isStopping) {
                this.timer = setTimeout(() => void this.loop(), this.intervalMs);
            }
        }
    }
    stop() {
        this.isStopping = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        console.log("[OUTBOX WORKER] Detenido.");
    }
}
async function startWorker() {
    try {
        const { pagination_record_events_limit } = workerData;
        /*
         * Esta conexión pertenece exclusivamente al Worker Thread.
         */
        await rabbitMQClient.connect();
        const repository = new OutboxEventRepository();
        const publisher = new RabbitEventPublisher();
        const useCase = new PublishPendingEventsUseCase(repository, publisher);
        const worker = new OutboxPublisherWorker(useCase, env.interval_worker_execution_time ?? 5000, Number(pagination_record_events_limit));
        worker.start();
    }
    catch (error) {
        console.error('[OUTBOX WORKER] Failed to initialize.', error);
        parentPort?.postMessage({
            message: 'Outbox worker initialization failed: ' +
                (error instanceof Error
                    ? error.message
                    : String(error)),
            ok: false,
        });
        process.exitCode = 1;
    }
}
void startWorker();
//# sourceMappingURL=event-worker.js.map