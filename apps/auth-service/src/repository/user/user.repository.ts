import { databaseInstance } from "../../config/query.ts";
import { CreateUserDto } from "../../dto/user/create-user.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { UserStatus } from "../../enum/UserStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IUserDataPaginatedDto } from "../../interfaces/user/user-data-paginated.interface.ts";
import { IUserRepository } from "../../interfaces/user/user-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";
import { GetUserRolesResponse } from "./user_role.repository.ts";

export type CreateUserReponse = {
    id: number;
    external_id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export type GetUserResponse = {
    id: number;
    external_id: string;
    email: string;
    first_name: string;
    last_name: string;
    created_at: string
}

export type UserWithAccessResponse = {
    id: number;
    external_id: string;
    email: string;
    first_name: string;
    last_name: string;
    status: UserStatus;
    created_at: Date;
    roles: GetUserRolesResponse[]
    permissions: string[];
}


export class UserRepository implements IUserRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async findUsersPaginated(options: IUserDataPaginatedDto): Promise<UserWithAccessResponse[]> {

        const params: Array<number | string> = [];
        let sql = `
            SELECT
                u.id,
                u.external_id,
                u.email,
                u.first_name,
                u.last_name,
                u.status,
                u.created_at,
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', r.id,
                                    'name', r.name,
                                    'description', r.description
                                )
                                ORDER BY r.name
                            )
                            FROM user_roles ur
                            JOIN roles r
                                ON r.id = ur.role_id
                            WHERE ur.user_id = u.id
                            AND ur.status = 'active'
                            AND r.status = 'active'
                        ),
                        '[]'::jsonb
                    ) AS roles,

                    COALESCE(
                        (
                            SELECT jsonb_agg(p.code ORDER BY p.code) permission_code
                            FROM user_roles ur
                            JOIN roles r
                                ON r.id = ur.role_id
                            JOIN role_permissions rp
                                ON rp.role_id = r.id
                            JOIN permissions p
                                ON p.id = rp.permission_id
                            WHERE ur.user_id = u.id
                            AND ur.status = 'active'
                            AND r.status = 'active'
                        
                        ),
                        '[]'::jsonb
                    ) AS permissions

                FROM users u
        
        `;
        if (options.id) {
            params.push(options.id);
            sql += `
                AND u.id = ${params.length}
            `;
        }

        if (options.external_id) {
            params.push(options.external_id);
            sql += `
                AND u.external_id = ${params.length}
            `;
        }

        if (options.email) {
            params.push(options.email);
            sql += `
                AND u.email = ${params.length}
            `;
        }


        if (options.status) {
            params.push(options.status);
            sql += `
                AND u.status = ${params.length}
            `;
        }

        if (options.initial_date && options.final_date) {
            params.push(options.initial_date, options.final_date);
            sql += `
              AND TO_CHAR(fecha_columna, 'YYYY-MM-DD') BETWEEN ${params.length - 1} AND ${params.length};
            
            `
        }
        params.push(options.limit!);
        const indexLimit = params.length;

        params.push(options.offset!);
        const indexOffset = params.length;

        sql += ` ORDER BY u.id DESC LIMIT ${indexLimit} OFFSET ${indexOffset} ;`;

        const response = await this._db.query<UserWithAccessResponse>(sql, params);
        return response;
    }
    async save(dto: CreateUserDto): Promise<CreateUserReponse> {
        const sql = `
            insert into users(external_id, email, password_hash,first_name, last_name) values($1,$2,$3,$4,$5)
            RETURNING id,external_id, email,first_name, last_name;
        `;
        const [response] = await this._db.query<CreateUserReponse>(sql, [dto.external_id, dto.email, dto.password, dto.first_name, dto.last_name]);

        if (!response || !response.email)
            throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error trying to create user');

        return response;

    }
    update(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async findbyId(user_id: number): Promise<GetUserResponse | undefined> {

        const sql = 'select id,external_id, email,first_name, last_name, created_at from users where id = $1';
        const [response] = await this._db.query<GetUserResponse>(sql, [user_id]);
        return response;
    }

    async findbyEmail(email: string): Promise<GetUserResponse | undefined> {

        const sql = 'select id,external_id, email,first_name, last_name, created_at from users where email = $1';
        const [response] = await this._db.query<GetUserResponse>(sql, [email]);
        return response;
    }

    delete(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}