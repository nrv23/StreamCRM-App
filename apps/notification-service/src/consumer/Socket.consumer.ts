import { Worker } from "node:worker_threads";
import { SocketServer } from "../config/socketio.ts";
import { SOCKET_EMMIT } from "../shared/types/events.type..ts";
import { ISocketConsumer } from "../interfaces/consumer/socket-consumer.interface.ts";
import { SocketMessage } from "../interfaces/socket/SocketMessage.interface.ts";

export class SocketConsumer implements ISocketConsumer {

    constructor(
        private readonly socketServer: SocketServer
    ) { }

    consume(message: SocketMessage): void {
        console.log({ message })
        if (message.type !== 'socket') return;
        if (message.event !== SOCKET_EMMIT) return;
        console.log('emiting message....', message);
        this.socketServer.emitToRoom(
            message.room,
            message.payload.data.event!.toString(),
            message.payload
        );
    }
}