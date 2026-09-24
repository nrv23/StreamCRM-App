import { databaseInstance } from "../../config/query.ts";
import { CreateAuthCodeDto } from "../../dto/user/create-auth-code.dto.ts";
import { AuthCode } from "../../entity/AuthCode.entity.ts";
import { AuthCodeStatus } from "../../enum/AuthCodeStatus.enum.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IDobleAuthenticateRepositpry } from "../../interfaces/user/doble-authenticate.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type GetCodeAuthenticatorDataResponse = {


};

export type SetStatusCodeAuthenticatorReponse = {

}

export class _2FAuthenticatorRepository implements IDobleAuthenticateRepositpry {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
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
    async getCodeAuthenticatorData(external_id: string, user_id: number): Promise<GetCodeAuthenticatorDataResponse | undefined> {

        const sql = `
        
        select au.code_hash as authcode, au.status
        from auth_codes au
        inner join users u on u.id = au.user_id
        where au.external_id = $1
        and u.id = $2
        `;

        const [response] = await this._db.query<GetCodeAuthenticatorDataResponse>(sql, [external_id, user_id]);
        return response;

    }
    setStatusCodeAuthenticator(external_id: string, user_id: number, status: AuthCodeStatus): Promise<void> {

        let sql: string;
        switch (status) {
            case AuthCodeStatus.active:
                sql = 'Update auth_codes set estado = $1, revoked_at=null, used_at= null where user_id = $3 and external_id = $4 returning id;';
                break;
            case AuthCodeStatus.used:
                sql = 'Update auth_codes set estado = $1, revoked_at=null, used_at= now() where user_id = $3 and external_id = $4 returning id;';
                break;
            case AuthCodeStatus.revoked:
                sql = 'Update auth_codes set estado = $1, revoked_at=now(), used_at= null where user_id = $3 and external_id = $4 returning id;';
                break;
            case AuthCodeStatus.expired:
                sql = 'Update auth_codes set estado = $1, revoked_at=null, used_at= null where user_id = $3 and external_id = $4 returning id;';
                break;
            default:
                throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, `AuthCodeStatus: ${status} not implemented`);
        }

        const [response] = await this._db.query
    }
    setAttemps(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}