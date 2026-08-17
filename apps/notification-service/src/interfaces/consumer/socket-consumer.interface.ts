import { Worker } from "node:worker_threads";


export interface ISocketConsumer {
    consume(worker: Worker): void;
}