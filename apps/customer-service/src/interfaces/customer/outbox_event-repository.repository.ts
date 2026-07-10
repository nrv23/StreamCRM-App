import { createOutboxEventDto } from "../../dto/customer/createOutboxEvent.dto.js";
import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";


export interface IOutboxEventsRepository {

    save(event: createOutboxEventDto): Promise<OutBoxEvent>;
}