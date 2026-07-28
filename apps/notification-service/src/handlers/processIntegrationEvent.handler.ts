import { CreateNotificationDto } from "../dto/notifications/create-notification.dto.ts";
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
        event: CreateNotificationDto,
    ): Promise<ProcessEventResult> {
        console.log(
            `[ProcessIntegrationEvent] Evento recibido: ${event.eventName}`,
        );

        const alreadyProcessed = await this.processedEventRepository.exists(event.eventId);

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
            event_id: event.eventId,
            event_name: event.eventName

        });

        return {
            status: "processed",
        };
    }
}