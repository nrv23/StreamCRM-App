import { parentPort } from "node:worker_threads";
import { ProcessNotificationDeliveryService } from "../../services/ProcessNotificationDelivery.service.ts";


export class ProcessNotificationWorker {
    private timer?: NodeJS.Timeout;
    private isStopping = false;

    private readonly _procesNotificationService: ProcessNotificationDeliveryService;
    private readonly _intervalMs: number;

    constructor(
        procesNotificationService: ProcessNotificationDeliveryService,
        intervalMs = 5000,
        limit: number
    ) {

        this._procesNotificationService = procesNotificationService;
        this._intervalMs = intervalMs;
    }

    public start(): void {
        console.log(`[NOTIFICATION DELIVERIES WORKER] Iniciado. Polling cada ${this._intervalMs}ms...`);
        void this.loop();
    }

    private async loop(): Promise<void> {
        if (this.isStopping) return;

        try {
            // cambiar aqui el mensaje segun lo que retorne
            const hasNotificationDeliveriesProcessed = await this._procesNotificationService.execute();
            if (hasNotificationDeliveriesProcessed) {

                parentPort?.postMessage({
                    message: "notification deliveries batch processed successfully",
                    ok: true
                });
            } else {
                parentPort?.postMessage({
                    message: "No pending notification deliveries was found",
                    ok: true
                });
            }
        } catch (error) {
            console.error("[NOTIFICATION DELIVRIES WORKER] Error detectado. Apagando worker...", error);

            // 1. Notificamos al hilo principal
            parentPort?.postMessage({
                message: "process notification deliveries worker failed: " + (error as Error).message,
                ok: false
            });

            // 2. Detenemos el worker para que no vuelva a ejecutar otra tanda
            this.stop();

        } finally {
            // Si hubo error, this.stop() puso isStopping = true,
            // por lo que el if es falso y el thread muere limpiamente acá.
            if (!this.isStopping) {
                this.timer = setTimeout(() => void this.loop(), this._intervalMs);
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



