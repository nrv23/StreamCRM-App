import { databaseInstance } from "../../config/query.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IUserRoleRepository } from "../../interfaces/user/user-role-repository.interface.ts";


export class UserRoleRepository implements IUserRoleRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(userId: number, roleIds: number[]): Promise<void> {

        const sql = `
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, role_id
            FROM unnest($2::int[]) AS role_id -- unset permite tratar el parametro de tipo array como una tabla temporal y poder iterarla
            ON CONFLICT (user_id, role_id)
            DO NOTHING;
        `;
        await this._db.query(sql, [userId, roleIds])
    }
}