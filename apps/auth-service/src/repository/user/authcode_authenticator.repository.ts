import { databaseInstance } from "../../config/query.ts";
import { CreateAuthCodeDto } from "../../dto/user/create-auth-code.dto.ts";
import { AuthCode } from "../../entity/AuthCode.entity.ts";
import { AuthCodePurpose } from "../../enum/AuthCodePurpose.enum.ts";
import { AuthCodeStatus } from "../../enum/AuthCodeStatus.enum.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IDobleAuthenticateRepositpry } from "../../interfaces/user/doble-authenticate.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type GetCodeAuthenticatorDataResponse = {
    authcode: string;
    status: string;
    attempts: number;
    expired: boolean;
    user_id: number;
};

export type SetStatusCodeAuthenticatorReponse = {
    id: number;
}

export type GetNewCodeAuthenticator = {
    authcode: string;
}

export type IsEnabledTwoFactorAuthenticator = {
    isEnabled: boolean
}

export type IsLockedTwoFactorAuthenticator = {

    isLocked: boolean;
}

export type HasAnyAuthCodeByPurposeAndUserIdAndStatusResponse = {
    hasAny: number;
}

export class AuthCodeAuthenticatorRepository implements IDobleAuthenticateRepositpry {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async isEnabledTwoFactorAuthenticator(user_id: number): Promise<IsEnabledTwoFactorAuthenticator> {
        const sql = 'select two_factor_enabled as "isEnabled" from users where id = $1 ';
        const [response] = await this._db.query<IsEnabledTwoFactorAuthenticator>(sql, [user_id]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response;
    }
    async isLockedTwoFactorAuthenticator(user_id: number): Promise<IsLockedTwoFactorAuthenticator> {
        const sql = 'select two_factor_locked as "isLocked" from users where id = $1 ';
        const [response] = await this._db.query<IsLockedTwoFactorAuthenticator>(sql, [user_id]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response;
    }
    async getNewCodeAuthenticator(): Promise<GetNewCodeAuthenticator> {

        const sql = 'select generate_auth_user_code() as authcode;';
        const [response] = await this._db.query<GetNewCodeAuthenticator>(sql, []);
        if (!response || !response.authcode) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error getting new auth code');
        return response;

    }

    async saveCodeAuthenticator(dto: CreateAuthCodeDto): Promise<AuthCode> {

        const sql = `

            insert into auth_codes(
                 external_id,
                  user_id,
                  code_hash,
                  channel,
                  purpose,
                  status,
                  expires_at
            )
            values($1,$2,$3,$4,$5,$6,$7)
            returning *;
        `;

        const [response] = await this._db.query<AuthCode>(sql, [
            dto.external_id,
            dto.user_id,
            dto.code_hash,
            dto.channel,
            dto.purpose,
            dto.status,
            dto.expires_at
        ]);

        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create auth code');
        return response;
    }
    async getCodeAuthenticatorData(external_id: string, purpose: AuthCodePurpose): Promise<GetCodeAuthenticatorDataResponse | undefined> {

        const sql = `
            select au.code_hash as authcode, au.status, au.attempts, (
                case
                    when au.expires_at <= now() then true
                    else false
                end
            ) as "expired",
            au.user_id
            from auth_codes au
            inner join users u on u.id = au.user_id
            where au.external_id = $1
            and au.purpose = $2
        `;

        const [response] = await this._db.query<GetCodeAuthenticatorDataResponse>(sql, [external_id, purpose]);
        return response;

    }
    async setStatusCodeAuthenticator(external_id: string, user_id: number, status: AuthCodeStatus): Promise<void> {

        let sql: string;
        switch (status) {
            case AuthCodeStatus.active:
                sql = 'Update auth_codes set status = $1, revoked_at=null, used_at= null where user_id = $2 and external_id = $3 returning id;';
                break;
            case AuthCodeStatus.used:
                sql = 'Update auth_codes set status = $1, revoked_at=null, used_at= now() where user_id = $2 and external_id = $3 returning id;';
                break;
            case AuthCodeStatus.revoked:
                sql = 'Update auth_codes set status = $1, revoked_at=now(), used_at= null where user_id = $2 and external_id = $3 returning id;';
                break;
            case AuthCodeStatus.expired:
                sql = 'Update auth_codes set status = $1, revoked_at=null, used_at= null where user_id = $2 and external_id = $3 returning id;';
                break;
            default:
                throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, `AuthCodeStatus: ${status} not implemented`);
        }

        const [response] = await this._db.query<SetStatusCodeAuthenticatorReponse>(sql, [status, user_id, external_id]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to set status authcode');
    }
    async setAttemps(user_id: number, external_id: string): Promise<void> {
        const sql = 'update auth_codes set attempts = (attempts + 1) where user_id = $1 and external_id = $2 returning id';
        const [response] = await this._db.query<SetStatusCodeAuthenticatorReponse>(sql, [user_id, external_id]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to set status authcode');
    }

    async lockTwoFactorAuthenticator(reason: string, user_id: number): Promise<void> {

        const sql = 'update users set two_factor_locked =  true, two_factor_locked_at = now(), two_factor_lock_reason = $1 where id = $2 returning id';
        const [response] = await this._db.query<SetStatusCodeAuthenticatorReponse>(sql, [reason, user_id]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to lock 2fa ');
    }

    async enableTwoFactorAuthenticator(user_id: number): Promise<void> {
        const sql = `
            update users set two_factor_locked =  null, two_factor_locked_at = null, two_factor_lock_reason = null, two_factor_enabled = true 
            where id = $1 returning id;
          `;
        const [response] = await this._db.query<SetStatusCodeAuthenticatorReponse>(sql, [user_id]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to enable 2fa ');
    }

    async hasAnyAuthCodeByPurposeAndUserIdAndStatus(user_id: number, purpose: AuthCodePurpose, status: AuthCodeStatus): Promise<HasAnyAuthCodeByPurposeAndUserIdAndStatusResponse> {

        const sql = 'select count(1) as "hasAny" from auth_codes where user_id = $1 and purpose = $2 and status = $3';
        const [response] = await this._db.query<HasAnyAuthCodeByPurposeAndUserIdAndStatusResponse>(sql, [user_id, purpose, status]);
        if (!response || typeof response.hasAny === "undefined") throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response;
    }

}