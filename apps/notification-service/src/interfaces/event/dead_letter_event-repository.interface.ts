import { CreateDeadLetterEventDto } from "../../dto/deadLetterEvents/create-dead-letter-event.dto.ts";
import { DeadLetterEventEntity } from "../../entity/DeadLetterEvent.entity.ts";


export interface IDeadLetterEventRepository {
    save(dto: CreateDeadLetterEventDto): Promise<DeadLetterEventEntity>
}