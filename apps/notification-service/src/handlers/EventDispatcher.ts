
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";

export class EventDispatcher {
    constructor(
        private readonly handlers:
            Map<string, IntegrationEventHandler>,
    ) { }

    public async dispatch(
        event: CreateNotificationDto,
    ): Promise<void> {
        console.log(
            `[Dispatcher] Buscando handler para: ${event.eventName}`,
        );

        const handler =
            this.handlers.get(event.eventName);

        if (!handler) {
            throw new Error(
                `No existe un handler para ${event.eventName}`,
            );
        }

        console.log(
            `[Dispatcher] Handler encontrado: ${handler.constructor.name}`,
        );
        await handler.handle(event);
    }
}
