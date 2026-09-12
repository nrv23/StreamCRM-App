import { CreateUserDto } from "../../dto/user/create-user.dto.ts";
import { CreateUserReponse, GetUserResponse, UserWithAccessResponse } from "../../repository/user/user.repository.ts";
import { IUserDataPaginatedDto } from "./user-data-paginated.interface.ts";



export interface IUserRepository {
    save(dto: CreateUserDto): Promise<CreateUserReponse>;
    update(): Promise<void>;
    findbyEmail(email: string): Promise<GetUserResponse | undefined>;
    findbyId(user_id: number): Promise<GetUserResponse | undefined>;
    findUsersPaginated(options: IUserDataPaginatedDto): Promise<UserWithAccessResponse[]>;
    getRecordsCount(options: IUserDataPaginatedDto): Promise<number>;
    delete(): Promise<void>;
}