import { PublishPendingEventsUseCase } from "../../services/Publisher.service.js";

export class OutboxPublisherWorker {
    private timer?: NodeJS.Timeout;
    private running = false;

    constructor(
        private readonly workerEventPublisherService: PublishPendingEventsUseCase,
        private readonly intervalMs = 5000,
        private limit: number
    ) { }

    start(): void {
        void this.run();

        this.timer = setInterval(() => {
            void this.run();
        }, this.intervalMs);
    }

    private async run(): Promise<void> {
        if (this.running) return; // si ya esta ejecutando entonces no se ejcuta de nuevo

        this.running = true;

        try {
            await this.workerEventPublisherService.execute(this.limit);
        } catch (error) {
            console.error("Outbox worker failed", error);
        } finally {
            this.running = false;
        }
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}