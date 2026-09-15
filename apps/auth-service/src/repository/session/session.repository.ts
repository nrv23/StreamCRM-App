import { databaseInstance } from "../../config/query.ts";
import { CreateSessionDto } from "../../dto/session/create-session.dto.ts";
import { Session } from "../../entity/Session.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { SessionRevokedReasonEnum } from "../../enum/SessionRevokedReason.enum.ts";
import { SessionStatus } from "../../enum/SessionStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { ISessionRepository } from "../../interfaces/session/session-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type CreateSessionResponse = {
    id: number;
}

export type GetSessionIdByUserIdResponse = {
    session_id: string;
    expires_at: string;
}

export type RevokeSessionResponse = {
    id: number;
}

export class SessionRepository implements ISessionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async revoke(session_id: string): Promise<void> {
        const sql = `
            update auth_sessions 
            set 
                status = $1,
                revoked_at = NOW(),
                ended_at = NOW(),
                revoke_reason = $2
            where session_id = $3
            and status = $4
            returning id;
        `;
        const [response] = await this._db.query<RevokeSessionResponse>(sql, [SessionStatus.revoked, SessionRevokedReasonEnum.logout, session_id, SessionStatus.active]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);

    }
    async getCurrentSessionIdByUserId(session_id: string): Promise<GetSessionIdByUserIdResponse | null> {
        const sql = `
            select session_id, expires_at 
            from auth_sessions 
            where session_id = $1 
            and status = $2
            and revoked_at is null
            and expires_at > now()
        `;
        const [response] = await this._db.query<GetSessionIdByUserIdResponse>(sql, [session_id, SessionStatus.active]);
        if (!response || !response.session_id) return null;
        return response;
    }

    async save(dto: CreateSessionDto): Promise<Session> {

        const sql = 'insert into auth_sessions(user_id,session_id,ip_address,user_agent, expires_at) values($1,$2,$3,$4, $5) returning *;';
        const [response] = await this._db.query<Session>(sql, [dto.user_id, dto.session_id, dto.ip_address, dto.user_agent, dto.expires_at]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response
    }



}