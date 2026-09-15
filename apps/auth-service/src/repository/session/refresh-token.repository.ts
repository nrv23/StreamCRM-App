import { databaseInstance } from "../../config/query.ts";
import { CreateRefreshTokenDto } from "../../dto/session/create-refresh-token.dto.ts";
import { RefreshToken } from "../../entity/RefreshToken.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { RefreshTokenStatus } from "../../enum/RefreshTokenStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRefreshTokenRepository } from "../../interfaces/session/refresh-token-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type GetCurrentRefreshToken = {
    user_id: number;
    refresh_token: string;
    expired_at: string;
    session_id: string;
}

export type SetStatusRefreshToken = {

    expired_at: string;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async revoke(refreshToken: string, status: RefreshTokenStatus): Promise<SetStatusRefreshToken> {

        const sql = `update refresh_tokens set status = $1, revoked_at = now() where token_hash = $2 returning expired_at;`;
        const [response] = await this._db.query<SetStatusRefreshToken>(sql, [status, refreshToken]);
        if (!response || !response.expired_at) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response;
    }

    async save(dto: CreateRefreshTokenDto): Promise<RefreshToken> {

        const sql = 'insert into refresh_tokens(user_id, session_id,token_hash,expired_at) values($1,$2,$3,$4) returning *;';
        const [response] = await this._db.query<RefreshToken>(sql, [dto.user_id, dto.session_id, dto.token_hash, dto.expires_at]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response
    }

    async getCurrentRefreshToken(refreshToken: string): Promise<GetCurrentRefreshToken | null> {
        const sql = `
            select user_id, token_hash as refresh_token, expired_at, session_id 
            from refresh_tokens 
            where token_hash = $1 
            and status = $2
            and revoked_at is null 
            and expired_at > now()
            FOR UPDATE;
        `;
        const [response] = await this._db.query<GetCurrentRefreshToken>(sql, [refreshToken, RefreshTokenStatus.active]);
        if (!response || !response.refresh_token) return null;
        return response
    }

}