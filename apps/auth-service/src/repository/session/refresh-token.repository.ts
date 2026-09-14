import { databaseInstance } from "../../config/query.ts";
import { CreateRefreshTokenDto } from "../../dto/session/create-refresh-token.dto.ts";
import { RefreshToken } from "../../entity/RefreshToken.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRefreshTokenRepository } from "../../interfaces/session/refresh-token-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type GetCurrentRefreshToken = {
    user_id: number;
    refresh_token: string;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(dto: CreateRefreshTokenDto): Promise<RefreshToken> {

        const sql = 'insert into refresh_tokens(user_id, session_id,token_hash,expires_at) values($1,$2,$3,$4) returning *;';
        const [response] = await this._db.query<RefreshToken>(sql, [dto.user_id, dto.session_id, dto.token_hash, dto.expires_at]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response
    }

    async getCurrentRefreshToken(refreshToken: string): Promise<GetCurrentRefreshToken | null> {
        const sql = 'select user_id, refresh_token from refresh_tokens where user_id = $1 and revoked_at is null;';
        const [response] = await this._db.query<GetCurrentRefreshToken>(sql, [refreshToken]);
        if (!response || !response.refresh_token) return null;
        return response
    }

}