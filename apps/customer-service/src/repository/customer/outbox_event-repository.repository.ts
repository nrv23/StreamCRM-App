import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";
import { IDatabase } from "../../interfaces/customer/database.interface.js";
import { IOutboxEventsRepository } from "../../interfaces/customer/outbox_event-repository.repository.js";
import { databaseInstance } from "../../config/query.js";
import { createOutboxEventDto } from "../../dto/customer/createOutboxEvent.dto.js";

export class OutboxEventRepository implements IOutboxEventsRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(event: createOutboxEventDto): Promise<OutBoxEvent> {

        const outBoxEvent = await this._db.query<OutBoxEvent>(`
            Insert into outbox_events(
                event_id,event_name,aggregate_id,aggregate_type,payload,headers
            )
            values($1,$2,$3,$4,$5::jsonb,$6::jsonb)
            RETURNING id, event_id,event_name,aggregate_id,aggregate_type,payload,headers;
        `, [event.event_id, event.event_name, event.aggregate_id, event.aggregate_type, event.payload, event.headers]);

        return outBoxEvent[0] as OutBoxEvent;
    }
}