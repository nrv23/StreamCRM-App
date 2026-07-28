import { databaseInstance } from "../../config/query.ts";
import { CreateProcessedEventDto } from "../../dto/processedEvents/create-processed-event.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IProcessedEventRepository } from "../../interfaces/processedEvent/processedEvent-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

type ProcessedEventExistsRow = {
    exists: boolean;
};

type ProcessedEventInsertedRow = {
    id: number;
};


export class ProcessedEventRepository implements IProcessedEventRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async save(event: CreateProcessedEventDto): Promise<void> {
        const sql = 'insert into processed_events(event_id, event_name) values($1,$2);';
        const [response] = await this._db.query<ProcessedEventInsertedRow>(sql, [event.event_id, event.event_name]);
        if (!response || !response.id) {
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'There was an error when trying to insert processed event'
            );
        }
    }
    async exists(eventId: string): Promise<boolean> {
        const sql = `
          select count(1) as exists from processed_events
            WHERE event_id = $1
    `;

        const [row] =
            await this._db.query<ProcessedEventExistsRow>(
                sql,
                [eventId],
            );

        if (!row) {
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
            );
        }

        return row.exists;
    }

}