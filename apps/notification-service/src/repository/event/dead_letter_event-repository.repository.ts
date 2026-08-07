import { databaseInstance } from "../../config/query.ts";
import { CreateDeadLetterEventDto } from "../../dto/deadLetterEvents/create-dead-letter-event.dto.ts";
import { DeadLetterEventEntity } from "../../entity/DeadLetterEvent.entity.ts";
import { DeadLetterEventStatus } from "../../enum/DeadLetterEventStatus.enum.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IDeadLetterEventRepository } from "../../interfaces/event/dead_letter_event-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

type findByEventIdResponse = {
    found: number
}

export class DeadLetterEventRepository implements IDeadLetterEventRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async findByEventId(event_id: string): Promise<number> {

        const sql = 'select count(1) as found from dead_letter_events where event_id =$1';
        const [response] = await this._db.query<findByEventIdResponse>(sql, [event_id]);
        return response!.found;
    }
    public async save(
        dto: CreateDeadLetterEventDto,
    ): Promise<DeadLetterEventEntity> {
        const sql = `
            INSERT INTO dead_letter_events (
                service_name,
                queue_name,
                exchange,
                routing_key,
                event_id,
                event_name,
                payload,
                headers,
                reason,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7::json,
                $8::json,
                $9,
                $10
            )
            RETURNING *;
        `;

        const params = [
            dto.service_name,
            dto.queue_name,
            dto.exchange,
            dto.routing_key,
            dto.event_id,
            dto.event_name,
            dto.payload,
            dto.headers,
            dto.reason,
            DeadLetterEventStatus.PENDING
        ];

        const [savedDeadLetterEvent] = await this._db.query<DeadLetterEventEntity>(sql, params);

        if (!savedDeadLetterEvent) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR,
            `Dead letter event "${dto.event_id}" could not be saved.`)

        return savedDeadLetterEvent;
    }

}