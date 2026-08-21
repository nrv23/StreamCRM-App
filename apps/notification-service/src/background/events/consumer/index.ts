import { Worker } from "node:worker_threads";
import { SocketConsumer } from "../../../consumer/Socket.consumer.ts";
import { SocketServer } from "../../../config/socketio.ts";
import { RedisBootstrap } from "../../../config/redis.ts";
import { RedisSubscriber } from "../../../consumer/RedisSubscriber.consumer.ts";
import { STREAM_CRM_EVENT } from "../../../shared/types/events.type..ts";
import { SocketMessage } from "../../../interfaces/socket/SocketMessage.interface.ts";
import { WinstonLogger } from "../../../shared/utils/winstonLogger.ts";
import { env } from "../../../config/enviroment.ts";

export function startEventWorker(
    socketServer: SocketServer,
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
    const logger = WinstonLogger.getInstance(
        env.elastic_search_url,
        'event-worker',
        'debug',
        env.index_elastic_search_name
    );
    const client = RedisBootstrap.getInstance().getSubscriber();
    const redisConsumer = new RedisSubscriber<SocketMessage>(client, logger);
    const socketConsumer = new SocketConsumer(socketServer);

    redisConsumer.subscribe(STREAM_CRM_EVENT, message => {
        socketConsumer.consume(message);
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