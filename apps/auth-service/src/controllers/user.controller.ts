import { Request, Response } from 'express';
import { UserService } from "../services/user.service.ts";
import { CreateUserDto } from '../dto/user/create-user.dto.ts';
import { randomUUID } from "node:crypto";
import { ApiResponse } from '../shared/types/api-response.ts';
import { CreateUserReponse } from '../repository/user/user.repository.ts';
import { IUserDataResponse } from '../interfaces/user/user-data.interface.ts';


export class UserController {

    constructor(
        public userService: UserService
    ) {

    }

    async create(req: Request, res: Response) {

        const { email, first_name, last_name, password } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        const { id } = req.user;
        const userData: CreateUserDto = {
            external_id: randomUUID(),
            email,
            first_name,
            last_name,
            password
        }

        const dataResponse = await this.userService.createUser(userData, id, ip_address, user_agent);
        const response: ApiResponse<CreateUserReponse> = {
            success: true,
            response: {
                message: "user created successfully",
                details: dataResponse
            }
        }

        res.status(201).json(response);
        return;
    }

    async me(req: Request, res: Response) { // se usa el token para obtener el id de usuario 

        const { id } = req.user;

        const data = await this.userService.getMe(id);
        const response: ApiResponse<IUserDataResponse> = {
            success: true,
            response: {
                details: data
            }
        }

        res.status(200).json(response);
        return;
    }
}