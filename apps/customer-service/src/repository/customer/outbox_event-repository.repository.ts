import { OutBoxEvent } from "../../entity/OutBoxEvent.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { IOutboxEventsRepository } from "../../interfaces/customer/outbox_event-repository.interface.js";
import { databaseInstance } from "../../config/query.js";
import { createOutboxEventDto } from "../../dto/customer/createOutboxEvent.dto.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { StatusEvent } from "../../enum/StatusEvent.enum.js";

export class OutboxEventRepository implements IOutboxEventsRepository {
    /*

        Sí, viejo. Para ese markAs genérico yo gestionaría los campos así:

        Cuando pasa a published:
        status = 'published'
        published_at = now()
        last_error = null
        no incrementás retry_count
        Cuando pasa a failed:
        status = 'failed' o pending, según tu estrategia
        retry_count = retry_count + 1
        last_error = $error
        published_at = null

    */

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async markAsPublished(eventId: number): Promise<void> {

        const query = `
            update outbox_events set status = $1, published_at = now(), last_error = null
            where id = $2
            RETURNING id;
        `;
        const [response] = await this._db.query(query, [StatusEvent.published, eventId]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR,
            `outbox_events with id ${eventId} not found`
        );
    }

    async markAsFailed(
        eventId: number,
        error: string,
    ): Promise<void> {
        const sql = `
        UPDATE outbox_events
        SET
            status = CASE 
                WHEN (retry_count + 1) >= 5 then 'failed' 
                ELSE 'pending'
            END,
            retry_count = retry_count + 1,
            last_error = $1,
            published_at = null
        WHERE event_id = $2
        returning id;
    `;

        await this._db.query(sql, [StatusEvent.pending, error, eventId]);

        const [response] = await this._db.query(sql, [StatusEvent.pending, error, eventId]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR,
            `outbox_events with id ${eventId} not found`
        );
    }

    async save(event: createOutboxEventDto): Promise<OutBoxEvent> {

        const [outBoxEventResponse] = await this._db.query<OutBoxEvent>(`
            Insert into outbox_events(
                event_id,event_name,aggregate_id,aggregate_type,payload,headers
            )
            values($1,$2,$3,$4,$5::jsonb,$6::jsonb)
            RETURNING id, event_id,event_name,aggregate_id,aggregate_type,payload,headers;
        `, [event.event_id, event.event_name, event.aggregate_id, event.aggregate_type, event.payload, event.headers]);

        if (!outBoxEventResponse) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "Event was not inserted"
        );
        return outBoxEventResponse;
    }

    async findPending(limit: number): Promise<OutBoxEvent[]> {

        const sql = `
            SELECT
                id,
                event_id,
                event_name,
                aggregate_type,
                aggregate_id,
                payload,
                headers,
                retry_count,
                created_at
            FROM outbox_events
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT $1;
        `;

        const response = await this._db.query<OutBoxEvent>(sql, [limit]);
        return response;
    }


}