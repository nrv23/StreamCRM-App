import { CreateUserDto } from "../../dto/user/create-user.dto.ts";
import { CreateUserReponse } from "../../repository/user/user.repository.ts";



export interface IUserRepository {
    save(dto: CreateUserDto): Promise<CreateUserReponse>;
    update(): Promise<void>;
    find(): Promise<void>;
    delete(): Promise<void>;
}