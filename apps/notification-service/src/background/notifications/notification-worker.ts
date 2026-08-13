import { parentPort, workerData } from "node:worker_threads";
import { ProcessNotificationDeliveryService } from "../../services/ProcessNotificationDelivery.service.ts";
import { UnitOfWork } from "../../config/unitOfWork.ts";
import { NotificationDispatcher } from "../../handlers/notification-dispatcher.ts";
import { EmailSender } from "../../sender/email.sender.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HandlebarsTemplateEngine } from "../../handlebars/handlebarsTemplateEngine.ts";
import { SmsSender } from "../../sender/sms.sender.ts";
import { env } from "../../config/enviroment.ts";
import { WinstonLogger } from "../../shared/utils/winstonLogger.ts";


export class ProcessNotificationWorker {
    private timer?: NodeJS.Timeout;
    private isStopping = false;

    private readonly _procesNotificationService: ProcessNotificationDeliveryService;
    private readonly _intervalMs: number;

    constructor(
        procesNotificationService: ProcessNotificationDeliveryService,
        intervalMs = 5000
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



async function startWorker(): Promise<void> {

    const { pagination_record_notification_deliveries } = workerData;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const loggerServiceInstance = WinstonLogger.getInstance(
        env.elastic_search_url,
        'process-notification-delivery-service',
        'debug',
        env.index_elastic_search_name
    );
    const loggerSenderInstance = WinstonLogger.getInstance(
        env.elastic_search_url,
        'sender-service',
        'debug',
        env.index_elastic_search_name
    );
    // instancia de template engine
    const templatesDirectoryPath = path.join(__dirname, './../../templates/');
    const templateEngine = new HandlebarsTemplateEngine(templatesDirectoryPath);
    // 2. Instancias el sender y tu nuevo NotificationDispatcher
    const emailSender = new EmailSender(templateEngine, loggerSenderInstance); // (O la clase real que use nodemailer)
    const smsSender = new SmsSender(loggerSenderInstance);
    const dispatcher = new NotificationDispatcher(emailSender, smsSender)
    const unitOfWork = new UnitOfWork()
    const service = new ProcessNotificationDeliveryService(
        unitOfWork,
        dispatcher,
        +pagination_record_notification_deliveries,
        loggerServiceInstance
    )

    const worker = new ProcessNotificationWorker(service, 60000);
    await worker.start();
}

void startWorker();