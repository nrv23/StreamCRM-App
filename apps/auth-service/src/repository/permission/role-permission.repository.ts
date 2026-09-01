import { databaseInstance } from "../../config/query.ts";
import { CreateRolePermissionDto } from "../../dto/permission/create-role-permission.dto.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRolePermissionRepository } from "../../interfaces/permission/role-permission.interface.ts";


export type GetPermisssionsResponse = {
    code: string
}

export class RolePermissionRepository implements IRolePermissionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    getPermissionsByRoleIdAndUserId(user_id: number): Promise<GetPermisssionsResponse[]> {
        const sql = `
            SELECT DISTINCT p.code
            FROM user_roles ur
            JOIN roles r
            ON r.id = ur.role_id
            JOIN role_permissions rp
            ON rp.role_id = r.id
            JOIN permissions p
            ON p.id = rp.permission_id
            WHERE ur.user_id = $1
            AND ur.status = $2
            AND r.status = $3;
        `;

        const response = this._db.query<GetPermisssionsResponse>(sql, [user_id, RoleStatus.active, RoleStatus.active]);
        return response;
    }
    async save(dto: CreateRolePermissionDto): Promise<void> {

        const sql = `
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, p.id
            FROM unnest($2::varchar[]) AS permission_code
            INNER JOIN permissions p ON p.code = permission_code
            ON CONFLICT (role_id, permission_id)
            DO NOTHING;
        `;

        await this._db.query(sql, [dto.roleId, dto.permissionIds]);
    }
}