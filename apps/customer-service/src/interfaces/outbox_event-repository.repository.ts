import { createOutboxEventDto } from "../dto/createOutboxEvent.dto.js";
import { OutBoxEvent } from "../entity/OutBoxEvent.entity.js";


export interface IOutboxEventsRepository {

    save(event: createOutboxEventDto): Promise<OutBoxEvent>;
}