import { databaseInstance } from "../../config/query.ts";
import { CreateRoleDto } from "../../dto/user/create-role.dto.ts";
import { Role } from "../../entity/user/Role.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IRoleRepository } from "../../interfaces/user/role-reposiitory.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";



export class RoleRepository implements IRoleRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async save(dto: CreateRoleDto): Promise<Role> {

        const sql = 'insert into roles(name, description) values($1,$2) RETURNING *;';
        const [response] = await this._db.query<Role>(sql, [dto.name, dto.description])
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create role');
        return response;
    }
}