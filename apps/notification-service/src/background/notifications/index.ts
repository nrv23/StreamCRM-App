import { Worker } from "node:worker_threads";
import { env } from "../../config/enviroment.js";

const isDevelopment = import.meta.url.endsWith(".ts");

const workerUrl = isDevelopment
    ? new URL("./notification-worker-boostrap.mjs", import.meta.url)
    : new URL("./notification-worker.ts", import.meta.url);

const outboxWorker = new Worker(workerUrl, {
    workerData: {
        pagination_record_notification_deliveries: env.pagination_record_notification_deliveries,
    },
});

outboxWorker.on("message", (message: unknown) => {
    console.log("[MAIN <- NOTIFICATION DELIVERIES WORKER]", message);
});

outboxWorker.on("error", (error: Error) => {
    console.error(
        "[MAIN] Error crítico no capturado en el worker:",
        error,
    );
});

outboxWorker.on("exit", (code: number) => {
    if (code !== 0) {
        console.error(
            `[MAIN] notification deliveries worker finalizó de forma inesperada (código: ${code})`,
        );

        return;
    }

    console.log("[MAIN] notification deliveries worker finalizó ordenadamente.");
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `[MAIN] Señal ${signal} recibida. Apagando notification deliveries worker...`,
    );

    try {
        await outboxWorker.terminate();

        console.log("[MAIN] notification deliveries worker apagado.");
        process.exit(0);
    } catch (error) {
        console.error(
            "[MAIN] Error apagando el notification deliveries worker:",
            error,
        );

        process.exit(1);
    }
};

process.once("SIGINT", () => {
    void gracefulShutdown("SIGINT");
});

process.once("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
});
