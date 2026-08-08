import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { NotificationStatus } from "../enum/notification-status.enum.ts";
import { INotificationCommand } from "../interfaces/notification-command.interface.ts";
import { INotificationResponse } from "../interfaces/notification/notification-response.interface.ts";
import { INotificationSender } from "../interfaces/sender/sender.interface.ts";
import { EmailSender } from "../sender/email.sender.ts";
import { SmsSender } from "../sender/sms.sender.ts";
import { CircuitBreaker } from "../shared/utils/circuit-breaker.ts";

export interface INotificationDispatcher {
    dispatch(command: INotificationCommand): Promise<INotificationResponse>;
}
export class NotificationDispatcher implements INotificationDispatcher {
    // Mapa privado que mantiene las instancias ÚNICAS de los breakers en memoria
    private _breakers: Map<NotificationCommand, CircuitBreaker> = new Map();
    constructor(
        private _emailSender: EmailSender,
        private _smsSender: SmsSender
        // private readonly pushSender: IPushSender
    ) {

        this._breakers.set(
            NotificationCommand.EMAIL,
            new CircuitBreaker(3, 2, this._emailSender, 240000) // 5 fallos, 2 éxitos, 10s cooldown
        );

        this._breakers.set(
            NotificationCommand.SMS,
            new CircuitBreaker(3, 1, this._smsSender, 240000) // Reglas distintas para SMS si querés
        );
    }
    async dispatch(command: INotificationCommand): Promise<INotificationResponse> {
        const breaker = this._breakers.get(command.channel);

        if (!breaker) {
            throw new Error(`Channel ${command.channel} is not configured with a Circuit Breaker`);
        }

        // Se ejecuta .fire() sobre la instancia guardada en el Map para ese canal especifico
        return await breaker.fire(command);
    }
}