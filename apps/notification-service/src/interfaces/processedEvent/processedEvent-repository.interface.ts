import { CreateProcessedEventDto } from "../../dto/processedEvents/create-processed-event.dto.ts";


export interface IProcessedEventRepository {
    exists(eventId: string): Promise<boolean>;
    save(event: CreateProcessedEventDto
    ): Promise<void>;
}