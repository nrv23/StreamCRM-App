import { databaseInstance } from "../../config/query.ts";
import { CreateSessionDto } from "../../dto/session/create-session.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { ISessionRepository } from "../../interfaces/session/session-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type CreateSessionResponse = {
    id: number;
}


export class SessionRepository implements ISessionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(dto: CreateSessionDto): Promise<void> {

        const sql = 'insert into auth_sessions(user_id,session_id,ip_address,user_agent) values($1,$2,$3,$4) returning id;';
        const [response] = await this._db.query<CreateSessionResponse>(sql, [dto.user_id, dto.session_id, dto.ip_address, dto.user_agent]);

        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
    }

}