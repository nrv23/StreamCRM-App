import { Worker } from "node:worker_threads";
import { SocketConsumer } from "../../../consumer/Socket.consumer.ts";
import { SocketServer } from "../../../config/socketio.ts";

export function startEventWorker(
    socketServer: SocketServer
): Worker {

    const isDevelopment = import.meta.url.endsWith(".ts");

    const workerUrl = isDevelopment
        ? new URL("./event-worker.bootstrap.mjs", import.meta.url)
        : new URL("./consumer-bootstrap.js", import.meta.url);

    const outboxWorker = new Worker(workerUrl, {
        workerData: {},
    });

    // Escucha los mensajes enviados desde el worker
    // y los publica usando la instancia REAL de SocketServer del main thread.
    new SocketConsumer(socketServer).consume(outboxWorker);

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

        console.log(
            "[MAIN] Outbox worker finalizó ordenadamente.",
        );
    });

    let isShuttingDown = false;

    const gracefulShutdown = async (
        signal: NodeJS.Signals
    ): Promise<void> => {

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

    return outboxWorker;
}