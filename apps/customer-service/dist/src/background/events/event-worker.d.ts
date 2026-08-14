import { PublishPendingEventsUseCase } from "../../services/Publisher.service.js";
export declare class OutboxPublisherWorker {
    private timer?;
    private isStopping;
    private readonly workerEventPublisherService;
    private readonly intervalMs;
    private limit;
    constructor(workerEventPublisherService: PublishPendingEventsUseCase, intervalMs: number | undefined, limit: number);
    start(): void;
    private loop;
    stop(): void;
}
//# sourceMappingURL=event-worker.d.ts.map