
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";

export class EventDispatcher {
    constructor(
        private readonly handlers:
            Map<string, IntegrationEventHandler<RabbitEventDto>>,
    ) { }

    public async dispatch(
        event: RabbitEventDto,
    ): Promise<void> {
        console.log(
            `[Dispatcher] Buscando handler para: ${event.event_name}`,
        );

        const handler =
            this.handlers.get(event.event_name);

        if (!handler) {
            throw new Error(
                `No existe un handler para ${event.event_name}`,
            );
        }

        console.log(
            `[Dispatcher] Handler encontrado: ${handler.constructor.name}`,
        );
        await handler.handle(event);
    }
}
