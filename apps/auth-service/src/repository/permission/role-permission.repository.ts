import { databaseInstance } from "../../config/query.ts";
import { CreateRolePermissionDto } from "../../dto/permission/create-role-permission.dto.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRolePermissionRepository } from "../../interfaces/permission/role-permission.interface.ts";


export class RolePermissionRepository implements IRolePermissionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
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