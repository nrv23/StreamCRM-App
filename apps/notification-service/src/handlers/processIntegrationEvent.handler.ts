import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { ProcessedEventRepository } from "../repository/processedEvent/processedEvent-repository.repository.ts";
import { ProcessEventResult } from "../shared/types/process-event-result.type.ts";
import { EventDispatcher } from "./EventDispatcher.ts";

export class ProcessIntegrationEvent {
    constructor(
        private readonly processedEventRepository:
            ProcessedEventRepository,

        private readonly dispatcher:
            EventDispatcher,
    ) { }

    public async execute(
        event: RabbitEventDto,
    ): Promise<ProcessEventResult> {
        console.log(
            `[ProcessIntegrationEvent] Evento recibido: ${event.event_name}`,
        );

        const alreadyProcessed = await this.processedEventRepository.exists(event.event_id);

        if (alreadyProcessed) {
            console.log(
                "[ProcessIntegrationEvent] Evento duplicado",
            );

            return {
                status: "duplicated",
            };
        }

        // Aquí el dispatcher busca el handler correcto.
        await this.dispatcher.dispatch(event);

        // Solo se registra después de procesarlo correctamente.
        await this.processedEventRepository.save({
            event_id: event.event_id,
            event_name: event.event_name

        });

        return {
            status: "processed",
        };
    }
}