import { Worker } from "node:worker_threads";
import { env } from "../../config/enviroment.js";

const isDevelopment = import.meta.url.endsWith(".ts");

const workerUrl = isDevelopment
    ? new URL("./consumer-dlq-worker-boostrap.mjs", import.meta.url)
    : new URL("./consumer-dlq-event-worker.js", import.meta.url);

const outboxWorker = new Worker(workerUrl, {
    workerData: {},
});

outboxWorker.on("message", (message: unknown) => {
    console.log("[MAIN <- WORKER]", message);
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
            `[MAIN] Rabbitmq DLQ Consumer finalizó de forma inesperada (código: ${code})`,
        );

        return;
    }

    console.log("[MAIN] Rabbitmq DLQ Consumer finalizó ordenadamente.");
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `[MAIN] Señal ${signal} recibida. Apagando Rabbitmq DLQ Consumer...`,
    );

    try {
        await outboxWorker.terminate();

        console.log("[MAIN] Rabbitmq DLQ Consumer apagado.");
        process.exit(0);
    } catch (error) {
        console.error(
            "[MAIN] Error apagando el Rabbitmq DLQ Consumer:",
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
