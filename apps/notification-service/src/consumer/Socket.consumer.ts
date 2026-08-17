import { Worker } from "node:worker_threads";
import { SocketServer } from "../config/socketio.ts";
import { SocketMessage } from "../publisher/Socket.publsher.ts";
import { SOCKET_EMMIT } from "../shared/types/events.type..ts";
import { ISocketConsumer } from "../interfaces/consumer/socket-consumer.interface.ts";

export class SocketConsumer implements ISocketConsumer {

    constructor(
        private readonly socketServer: SocketServer
    ) { }

    consume(worker: Worker): void {

        worker.on('message', (message: SocketMessage) => {
            console.log("llego el mesnahe", message)
            if (message.type !== 'socket') return;
            if (message.event !== SOCKET_EMMIT) return;

            this.socketServer.emitToRoom(
                message.room,
                message.event,
                message.payload
            );
        });
    }
}