import { CreateUserDto } from "../../dto/user/create-user.dto.ts";
import { CreateUserReponse, GetUserResponse, UserWithAccessResponse } from "../../repository/user/user.repository.ts";
import { IUserDataPaginated } from "./user-data-paginated.interface.ts";



export interface IUserRepository {
    save(dto: CreateUserDto): Promise<CreateUserReponse>;
    update(): Promise<void>;
    findbyEmail(email: string): Promise<GetUserResponse | undefined>;
    findbyId(user_id: number): Promise<GetUserResponse | undefined>;
    findUsersPaginated(options: IUserDataPaginated): Promise<UserWithAccessResponse[]>
    delete(): Promise<void>;
}