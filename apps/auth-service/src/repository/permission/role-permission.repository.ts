import { databaseInstance } from "../../config/query.ts";
import { CreateRolePermissionDto } from "../../dto/permission/create-role-permission.dto.ts";
import { ValidateAllPermissionsDto } from "../../dto/permission/validate-all-permissions.dto.ts";
import { CustomePermissions } from "../../dto/user/create-user-role-permissions.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRolePermissionRepository } from "../../interfaces/permission/role-permission.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";


export type GetPermisssionsResponse = {
    code: string
}

export type HasAllowedPermissionResponse = {
    hasAllowedPermission: number;
}

export type hasAllPermissionsResponse = {

    hasAllPermissions: boolean;
}
export class RolePermissionRepository implements IRolePermissionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async deleteRolePermissionsByRoleId(role_id: number): Promise<void> {
        const sql = `
            DELETE FROM role_permissions WHERE role_id = $1;
        `;
        await this._db.query(sql, [role_id]);
    }

    async hasAllPermissions(dto: ValidateAllPermissionsDto): Promise<boolean> {

        const sql = `

            SELECT NOT EXISTS (
                SELECT 1
                FROM jsonb_to_recordset($1::jsonb)
                    AS incoming(
                        code varchar
                    )

                WHERE NOT EXISTS (
                    SELECT 1
                    FROM permissions p
                    JOIN role_permissions rp ON rp.permission_id = p.id
                    JOIN user_roles ur ON ur.role_id = rp.role_id
                    JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = $2
                    AND ur.status = $3
                    AND r.status = $4
                    and p.is_delegable is true -- el permiso puede delegarse a otro rol
                    AND p.code = incoming.code
                )
            ) AS "hasAllPermissions";
        
        `;

        const [response] = await this._db.query<hasAllPermissionsResponse>(sql, [JSON.stringify(dto.permissions), dto.user_id, dto.status, dto.status]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return response.hasAllPermissions;
    }

    async hasAllowedPermission(user_id: number, permission_code: string, status: RoleStatus): Promise<Boolean> {

        const sql = `
        
            SELECT count(1) as "hasAllowedPermission"
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            JOIN role_permissions rp ON rp.role_id = r.id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE ur.user_id = $1
            AND ur.status = $2
            AND r.status = $3
            and p.code = $4;
        `;
        const [response] = await this._db.query<HasAllowedPermissionResponse>(sql, [user_id, status, status, permission_code]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);
        return (response.hasAllowedPermission as number) > 0;

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