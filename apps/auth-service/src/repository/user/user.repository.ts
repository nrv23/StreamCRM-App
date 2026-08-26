import { databaseInstance } from "../../config/query.ts";
import { CreateUserDto } from "../../dto/user/create-user.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { IUserRepository } from "../../interfaces/user/user-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type CreateUserReponse = {
    id: number;
    external_id: string;
    email: string;
    first_name: string;
    last_name: string;
}


export class UserRepository implements IUserRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
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
    find(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    delete(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}