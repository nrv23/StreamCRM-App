import { databaseInstance } from "../../config/query.ts";
import { ValidateRolesDto } from "../../dto/permission/validate-roles.dto.ts";
import { CreateRoleDto } from "../../dto/user/create-role.dto.ts";
import { Role } from "../../entity/user/Role.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { GetRolesResponse } from "../../interfaces/user/get-roles.interface.ts";
import { IRoleRepository } from "../../interfaces/user/role-reposiitory.interface.ts";
import { ValidateRolesResponse } from "../../interfaces/user/validate-roles.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";
import { GetUserRolesResponse } from "./user_role.repository.ts";

export type validateUserRolesMatch = {
    matches: boolean
}

export type GetRoleByIdResponse = {
    id: number;
    name: string;
    description: string;
    is_system: boolean;
}



export class RoleRepository implements IRoleRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async validateUserRolesMatch(user_id: number, role_ids: number[]): Promise<boolean> {
        const sql = 'SELECT validate_user_roles_match($1, $2) AS matches;';
        const [response] = await this._db.query<validateUserRolesMatch>(sql, [user_id, role_ids]);
        if (!response) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to validate match roles');
        return response?.matches;
    }
    async validateRoles(dto: ValidateRolesDto): Promise<ValidateRolesResponse[]> {
        const sql = `
            SELECT r.id
            FROM unnest($1::int[]) AS role_id
            INNER JOIN roles r on r.id = role_id
            and r.status = $2
        `;
        const response = await this._db.query<ValidateRolesResponse>(sql, [dto.roles, dto.status]);
        return response;
    }

    async getAllRoles(): Promise<GetRolesResponse[]> {
        const sql = `
            select id, name, description, to_char(created_at,'YYYY-MM-DD') as created_at, is_system
            from roles;
        `;
        const response = await this._db.query<GetRolesResponse>(sql);
        return response;

    }
    async save(dto: CreateRoleDto): Promise<Role> {

        let sql = '';
        let params: Array<string | boolean> = [];
        if (dto.is_system) {
            sql = 'insert into roles(name, description) values($1,$2) RETURNING *;';
            params = [dto.name, dto.description];
        } else {
            sql = 'insert into roles(name, description, is_system) values($1,$2, $3) RETURNING *;';
            params = [dto.name, dto.description, Boolean(dto.is_system)];
        }

        const [response] = await this._db.query<Role>(sql, params);
        if (!response || !response.id) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create role');
        return response;
    }

    async getRole(role_id: number, user_id: number): Promise<GetRoleByIdResponse | undefined> {
        const sql = `
        
            select r.id, r.name, r.description, r.is_system 
            from roles r 
            inner join user_roles ur on ur.role_id = r.id
            inner join users u on u.id = ur.user_id
            where r.id = $1
            and u.id = $2
        `;
        const [response] = await this._db.query<GetRoleByIdResponse>(sql, [role_id, user_id]);
        return response;
    }

    async getRoleByName(name: string): Promise<GetUserRolesResponse | undefined> {
        const sql = `
                select 
                    r.id,
                    r.name as role,
                    r.description
                from roles r 
                where  r.name = $1;
            `;

        const [response] = await this._db.query<GetUserRolesResponse>(sql, [name]);
        return response;
    }

    async getRoleByNameAndStatus(name: string, status: RoleStatus): Promise<GetUserRolesResponse | undefined> {
        const sql = `
                select 
                    r.id,
                    r.name as role,
                    r.description
                from roles r 
                where  r.name = $1
                AND r.status = $2;
            `;

        const [response] = await this._db.query<GetUserRolesResponse>(sql, [name, status]);
        return response;
    }

}