import { parentPort, workerData } from "node:worker_threads";
import { OutboxEventRepository }
    from "../../repository/customer/outbox_event-repository.repository.js";
import { ConsoleEventPublisher }
    from "../../publisher/ConsoleEvent.publisher.js";
import { env }
    from "../../config/enviroment.js";
import { PublishPendingEventsUseCase }
    from "../../services/Publisher.service.js";
import { RabbitEventPublisher } from "../../publisher/RabbitEvent.publisher.ts";
import { rabbitMQClient } from "../../config/raabbitmq.ts";

export class OutboxPublisherWorker {
    private timer?: NodeJS.Timeout;
    private isStopping = false;

    private readonly workerEventPublisherService: PublishPendingEventsUseCase;
    private readonly intervalMs: number;
    private limit: number;

    constructor(
        workerEventPublisherService: PublishPendingEventsUseCase,
        intervalMs = 5000,
        limit: number
    ) {

        this.workerEventPublisherService = workerEventPublisherService;
        this.intervalMs = intervalMs;
        this.limit = limit;
    }

    public start(): void {
        console.log(`[OUTBOX WORKER] Iniciado. Polling cada ${this.intervalMs}ms...`);
        void this.loop();
    }

    private async loop(): Promise<void> {
        if (this.isStopping) return;

        try {
            await this.workerEventPublisherService.execute(this.limit);

            parentPort?.postMessage({
                message: "Events batch processed successfully",
                ok: true
            });
        } catch (error) {
            console.error("[OUTBOX WORKER] Error detectado. Apagando worker...", error);

            // 1. Notificamos al hilo principal
            parentPort?.postMessage({
                message: "Outbox worker failed: " + (error as Error).message,
                ok: false
            });

            // 2. Detenemos el worker para que no vuelva a ejecutar otra tanda
            this.stop();

        } finally {
            // Si hubo error, this.stop() puso isStopping = true,
            // por lo que el if es falso y el thread muere limpiamente acá.
            if (!this.isStopping) {
                this.timer = setTimeout(() => void this.loop(), this.intervalMs);
            }
        }
    }

    public stop(): void {
        this.isStopping = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        console.log("[OUTBOX WORKER] Detenido.");
    }
}
async function startWorker(): Promise<void> {
    try {
        const { pagination_record_events_limit } = workerData;

        /*
         * Esta conexión pertenece exclusivamente al Worker Thread.
         */
        await rabbitMQClient.connect();

        const repository = new OutboxEventRepository();
        const publisher = new RabbitEventPublisher();

        const useCase = new PublishPendingEventsUseCase(
            repository,
            publisher,
        );

        const worker = new OutboxPublisherWorker(
            useCase,
            env.interval_worker_execution_time ?? 5000,
            Number(pagination_record_events_limit),
        );

        worker.start();
    } catch (error) {
        console.error(
            '[OUTBOX WORKER] Failed to initialize.',
            error,
        );

        parentPort?.postMessage({
            message:
                'Outbox worker initialization failed: ' +
                (error instanceof Error
                    ? error.message
                    : String(error)),
            ok: false,
        });

        process.exitCode = 1;
    }
}

void startWorker();
