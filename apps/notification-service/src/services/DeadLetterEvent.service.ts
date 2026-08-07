import { CreateDeadLetterEventDto } from "../dto/deadLetterEvents/create-dead-letter-event.dto.ts";
import { DeadLetterEventEntity } from "../entity/DeadLetterEvent.entity.ts";
import { IDeadLetterEventRepository } from "../interfaces/event/dead_letter_event-repository.interface.ts";


export class DeadLetterEventService {


    private _deadLetterEventRepository: IDeadLetterEventRepository;

    constructor(
        deadLetterEventRepository: IDeadLetterEventRepository
    ) {
        this._deadLetterEventRepository = deadLetterEventRepository;

    }

    async save(dto: CreateDeadLetterEventDto): Promise<DeadLetterEventEntity> {
        return await this._deadLetterEventRepository.save(dto);
    }

    async find(event_id: string) {
        return await this._deadLetterEventRepository.findByEventId(event_id);
    }
}