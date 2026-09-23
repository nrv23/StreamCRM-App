import { databaseInstance } from "../../config/query.ts";
import { CreatePermissionDto } from "../../dto/permission/create-permission.dto.ts";
import { GetDelegablePermissionsDto } from "../../dto/permission/get-delegable-permissions.dto.ts";
import { Permission } from "../../entity/permission/Permission.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { GetAllPermissionsResponse } from "../../interfaces/permission/get-permission.interface.ts";
import { IPermissionRepository } from "../../interfaces/permission/permission-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";


export type HasDelegablePermissionsResponse = {
    hasDelegablePermissions: boolean;
}

export class PermissionRepository implements IPermissionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async getAllPermissions(): Promise<GetAllPermissionsResponse[]> {
        const sql = "select id, code, description, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at from permissions;";
        const response = await this._db.query<GetAllPermissionsResponse>(sql);
        return response;
    }
    async save(dto: CreatePermissionDto): Promise<Permission> {
        const sql = 'insert into Permissions(code, description) values($1,$2) RETURNING *';
        const [response] = await this._db.query<Permission>(sql, [dto.code, dto.description]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create permission');
        return response;
    }

    async hasDelegablePermissions(dto: GetDelegablePermissionsDto): Promise<boolean> {

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
                where p.code = incoming.code -- p.is_delegable is true el permiso puede delegarse a otro rol
                -- AND p.code = incoming.code
                )
            ) AS "hasDelegablePermissions";
        `;

        const [response] = await this._db.query<HasDelegablePermissionsResponse>(sql, [JSON.stringify(dto.permissions)]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR);

        return response.hasDelegablePermissions;
    }
}