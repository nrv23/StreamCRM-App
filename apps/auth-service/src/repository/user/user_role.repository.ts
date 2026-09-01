import { databaseInstance } from "../../config/query.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IUserRoleRepository } from "../../interfaces/user/user-role-repository.interface.ts";

export type GetUserRolesResponse = {
    role: string;
    description: string;
    id: number;
}

export class UserRoleRepository implements IUserRoleRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async getRolesByUserId(user_id: number): Promise<GetUserRolesResponse[]> {

        const sql = `
            select 
                r.id,
                r.name as role,
                r.description 
            from roles r 
            join user_roles ur on r.id = ur.role_id 
            where  ur.user_id = $1
            AND ur.status = $2
            AND r.status = $3;
        `;

        const response = await this._db.query<GetUserRolesResponse>(sql, [user_id, RoleStatus.active, RoleStatus.active]);
        return response;
    }

    async save(user_id: number, role_Ids: number[]): Promise<void> {

        const sql = `
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, role_id
            FROM unnest($2::int[]) AS role_id -- unset permite tratar el parametro de tipo array como una tabla temporal y poder iterarla
            ON CONFLICT (user_id, role_id)
            DO NOTHING;
        `;
        await this._db.query(sql, [user_id, role_Ids])
    }
}