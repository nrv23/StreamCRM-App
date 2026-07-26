import { Worker } from "node:worker_threads";
import { env } from "../../config/enviroment.js";

const isDevelopment = import.meta.url.endsWith(".ts");

const workerUrl = isDevelopment
    ? new URL("./event-worker.bootstrap.mjs", import.meta.url)
    : new URL("./event-worker.js", import.meta.url);

const outboxWorker = new Worker(workerUrl, {
    workerData: {
        pagination_record_events_limit:
            env.pagination_record_events_limit,
    },
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
            `[MAIN] Outbox worker finalizó de forma inesperada (código: ${code})`,
        );

        return;
    }

    console.log("[MAIN] Outbox worker finalizó ordenadamente.");
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `[MAIN] Señal ${signal} recibida. Apagando outbox worker...`,
    );

    try {
        await outboxWorker.terminate();

        console.log("[MAIN] Outbox worker apagado.");
        process.exit(0);
    } catch (error) {
        console.error(
            "[MAIN] Error apagando el outbox worker:",
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
