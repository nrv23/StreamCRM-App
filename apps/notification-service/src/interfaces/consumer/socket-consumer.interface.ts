import { Worker } from "node:worker_threads";
import { SocketMessage } from "../socket/SocketMessage.interface.ts";


export interface ISocketConsumer {
    consume(message: SocketMessage): void;
}