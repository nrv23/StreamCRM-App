import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { INotificationCommand } from "../../interfaces/notification-command.interface.ts";
import { INotificationResponse } from "../../interfaces/notification/notification-response.interface.ts";
import { INotificationSender } from "../../interfaces/sender/sender.interface.ts";

enum TState {
    CLOSE = 'close',
    OPEN = 'open',
    HALFOPEN = 'half-open'
}

export class CircuitBreaker {

    private _minSuccesses: number; // Peticiones exitosas necesarias en HALF-OPEN para cerrar
    private _maxFailures: number;  // Máximo permitido de intentos fallidos en CLOSE
    private _state: TState;
    private _senderRequest: INotificationSender;
    private _failureCount: number = 0;
    private _successCount: number = 0;
    private _cooldownWindow: number; // Tiempo que el circuito permanece abierto (ms)
    private _nextAttempt: number = 0;

    constructor(
        maxFailures: number,
        minSuccesses: number,
        senderRequest: INotificationSender,
        coolWindow?: number,
    ) {
        this._maxFailures = maxFailures;
        this._minSuccesses = minSuccesses;
        this._senderRequest = senderRequest;
        this._cooldownWindow = coolWindow || 10000; // 10 segundos por defecto
        this._state = TState.CLOSE;
    }

    async fire(args: INotificationCommand): Promise<INotificationResponse> {

        console.log({
            state: this._state
        })
        // 1. Evaluar si el circuito está ABIERTO
        if (this._state === TState.OPEN) {
            if (Date.now() < this._nextAttempt) {
                console.log('Retornar mensaje por defecto...');
                // Fail Fast: Bloqueado por cooldown
                return {
                    error_message: 'Circuit breaker is OPEN because provider return error response in sender: ' + args.channel,
                    status: NotificationDeliveryStatus.FAILED
                } as INotificationResponse;
            }

            // Venció el cooldown: pasamos a modo prueba (HALF-OPEN)
            this._state = TState.HALFOPEN;
            this._successCount = 0;
            this._failureCount = 0;
        }

        // 2. Ejecutar petición al proveedor
        const response = await this._senderRequest.send(args);

        // 3. Registrar el resultado
        if (response.status === NotificationDeliveryStatus.FAILED) {
            this.fail();
        } else {
            this.success();
        }

        return response;
    }

    private success() {
        if (this._state === TState.CLOSE) {
            // Un éxito en normalidad limpia fallos previos acumulados
            this._failureCount = 0;
        }

        if (this._state === TState.HALFOPEN) {
            this._successCount++;

            // Si acumulamos las pruebas exitosas requeridas, recuperamos el servicio
            if (this._successCount >= this._minSuccesses) {
                this._state = TState.CLOSE;
                this.resetCounters();
            }
        }
    }

    private fail() {
        if (this._state === TState.CLOSE) {
            this._failureCount++;
            console.log({
                _failureCount: this._failureCount
            });
            if (this._failureCount >= this._maxFailures) {
                console.log('Circuito abierto');
                this.tripToOpen();
            }
        } else if (this._state === TState.HALFOPEN) {
            // En HALF-OPEN, con UN SOLO fallo volvemos a abrir el circuito de inmediato
            this.tripToOpen();
        }
    }

    private tripToOpen() {
        this._state = TState.OPEN;
        this._nextAttempt = Date.now() + this._cooldownWindow;
        this.resetCounters();
    }

    private resetCounters() {
        this._failureCount = 0;
        this._successCount = 0;
    }
}
// el circuito esta cerrado
// falla 10 veces seguidas
// el circuito se abre y espera 10 segundos y responde con un error.
// pasados los 10 segundos, el circuito pasa a medio abierto y permite dos o 3 solicitudes.
// si alguna de esas solicitudes pasa bien, el circuito se cierra y se resetean contadores.
// si vuelve a fallar entonces se vuelve a contar hasta 10 y se vuelve a generar todo el proceso. 