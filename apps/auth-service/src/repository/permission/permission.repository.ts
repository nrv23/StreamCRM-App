import { databaseInstance } from "../../config/query.ts";
import { CreatePermissionDto } from "../../dto/permission/create-permission.dto.ts";
import { Permission } from "../../entity/permission/Permission.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IPermissionRepository } from "../../interfaces/permission/permission-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export class PermissionRepository implements IPermissionRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async save(dto: CreatePermissionDto): Promise<Permission> {
        const sql = 'insert into Permissions(code, description) values($1,$2) RETURNING *';
        const [response] = await this._db.query<Permission>(sql, [dto.code, dto.description]);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create permission');
        return response;
    }
}