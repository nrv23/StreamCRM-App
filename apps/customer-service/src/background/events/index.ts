import { Worker } from "node:worker_threads";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../../config/enviroment.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Soporte para TypeScript en dev (.ts) y compilado en prod (.js)
const ext = path.extname(import.meta.url) === ".ts" ? ".ts" : ".js";
const workerPath = join(__dirname, `./event-worker${ext}`);

const outboxWorker = new Worker(workerPath, {
    // Si estás corriendo en desarrollo con tsx / ts-node, agregamos el loader
    execArgv: ext === ".ts" ? ["--import", "tsx"] : [],
    workerData: {
        pagination_record_events_limit: env.pagination_record_events_limit
    }
});

outboxWorker.on("message", (message) => {
    // Acá podés loguear o simplemente auditar las tandas procesadas
    console.log("[MAIN <- WORKER]", message);
});

outboxWorker.on("error", (error) => {
    console.error("[MAIN] Error crítico no capturado en el worker:", error);
});

outboxWorker.on("exit", (code) => {
    if (code !== 0) {
        console.error(`[MAIN] Outbox worker finalizó de forma inesperada (código: ${code})`);
        // Opcional: Podrías re-instanciar el worker acá si murió inesperadamente
    } else {
        console.log(`[MAIN] Outbox worker finalizó ordenadamente.`);
    }
});

// Apagado Graceful: Apagamos el worker cuando la app principal se detiene
const gracefulShutdown = async () => {
    console.log("[MAIN] Apagando outbox worker...");
    await outboxWorker.terminate(); // Termina el thread de inmediato
    process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);