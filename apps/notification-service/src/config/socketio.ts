import { Server } from "http";
import { Server as SocketIOServer, Socket, Namespace } from "socket.io";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { SOCKET_CONNECTED, SOCKET_DISCONNECTED } from "../shared/types/events.type..ts";
import { env } from "./enviroment.ts";
import { SocketPayload } from "../publisher/Socket.publsher.ts";


export class SocketServer {
    private static _instance: SocketServer;
    private _io!: SocketIOServer;
    private _app: Server;
    private _logger: Logger;
    private readonly _namespace: string = '/notifications';
    private _notificationsNamespace!: Namespace;
    //private _roomsMap: Map<Record<string,string>>;

    // Constructor privado para forzar el uso de Singleton
    private constructor(app: Server, logger: Logger) {
        this._app = app;
        this._logger = logger;
        this.initSocketServer();
    }

    // Método estático para inicializar o recuperar la instancia única
    public static init(app: Server, logger: Logger): SocketServer {
        if (!SocketServer._instance) {
            SocketServer._instance = new SocketServer(app, logger);
        }
        return SocketServer._instance;
    }

    // Permite obtener la instancia ya inicializada en otros módulos/controladores
    public static getInstance(): SocketServer {
        if (!SocketServer._instance) {
            throw new Error("SocketServer no ha sido inicializado. Llama a SocketServer.init(app, logger) primero.");
        }
        return SocketServer._instance;
    }

    private initSocketServer(): void {
        this._io = new SocketIOServer(this._app, {
            cors: { origin: "*" } // cuando se cree el authservice y gateway esto se va cambiar
        });
        this._notificationsNamespace = this._io.of(this._namespace);

        this._notificationsNamespace.on("connection", (socket: Socket) => {

            //const room = socket.handshake.query.room! as string;
            this.logEvent(SOCKET_CONNECTED, socket, "socket connected");
            console.log({
                room: socket.handshake.query!.room!
            })
            this.joinRoom(socket.id, socket.handshake.query!.room!.toString())
            this.emitToAll(SOCKET_CONNECTED,
                {
                    message: 'New cliente connected ' + socket.id,
                    created_at: new Date().toISOString()
                }
            );


            socket.on("disconnect", () => {
                this.logEvent(SOCKET_DISCONNECTED, socket, "socket disconnected");
            });
        });
    }

    // --- MÉTODOS PROPIOS (EN LUGAR DE EXPONER IO DIRECTAMENTE) ---

    // Emitir a todos los clientes conectados
    public emitToAll(event: string, payload: unknown): void {
        this._logger.info(`[SocketServer] Emitiendo evento global: ${event}`, { payload });
        this._notificationsNamespace.emit(event, payload);
    }

    // Emitir a una sala/room específica
    public emitToRoom(room: string, event: string, payload: SocketPayload): void {
        this._logger.info(`[SocketServer] Emitiendo a room ${room}: ${event}`, { payload });
        this._notificationsNamespace.to(room).emit(event, payload);
    }

    // Hacer que un socket se una a una sala (ej: userId o canal de notificación)
    public joinRoom(socketId: string, room: string): void {
        const socket = this._notificationsNamespace.sockets.get(socketId);
        if (socket) {
            socket.join(room);
            this._logger.info(`Socket ${socketId} unido a la room ${room}`);
        }
    }

    // Helper para formatear logs con Winston
    private logEvent(eventType: string, socket: Socket, message: string): void {
        const log: ILogMetadata = {
            service: env.service_name,
            created_at: new Date().toISOString(),
            event: eventType,
            payload: {
                socket_id: socket.id,
                socket_data: socket.data
            }
        };
        this._logger.info(message, log);
    }
}