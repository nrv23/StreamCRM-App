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
    created_at: string;
    password?: string;
    status?: UserStatus;
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

export type GetUsersCountResponse = {
    count: number;
}


export class UserRepository implements IUserRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async getRecordsCount(options: IUserDataPaginatedDto): Promise<number> {

        const sql = `SELECT get_users_records_count($1, $2, $3, $4, $5, $6) AS count;`;
        const params: Array<number | string | null> = [] = [
            options.id ?? null,
            options.external_id ?? null,
            options.email ?? null,
            options.status ?? null,
            options.initial_date ?? null,
            options.final_date ?? null
        ];

        const [response] = await this._db.query<GetUsersCountResponse>(sql, params);

        if (!response || response.count === undefined || response.count === null)
            throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'There was an error getting users list');

        return +response.count;
    }
    async findUsersPaginated(options: IUserDataPaginatedDto): Promise<UserWithAccessResponse[]> {

        const sql = 'select * from find_users_paginated($1,$2,$3,$4,$5,$6,$7,$8);';
        const params: Array<number | string | null> = [] = [
            options.id ?? null,
            options.external_id ?? null,
            options.email ?? null,
            options.status ?? null,
            options.initial_date ?? null,
            options.final_date ?? null,
            options.limit!,
            options.offset!
        ];
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

        const sql = 'select id,external_id, email,first_name, last_name, created_at, password_hash as password, status from users where email = $1';
        const [response] = await this._db.query<GetUserResponse>(sql, [email]);
        return response;
    }

    delete(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}