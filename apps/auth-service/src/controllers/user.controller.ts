import { Request, Response } from 'express';
import { UserService } from "../services/user.service.ts";
import { CreateUserDto } from '../dto/user/create-user.dto.ts';
import { randomUUID } from "node:crypto";
import { ApiResponse } from '../shared/types/api-response.ts';
import { CreateUserReponse, UserWithAccessResponse } from '../repository/user/user.repository.ts';
import { IUserDataResponse } from '../interfaces/user/user-data.interface.ts';
import { IUserDataPaginatedDto } from '../interfaces/user/user-data-paginated.interface.ts';
import { env } from '../config/enviroment.ts';
import { IPaginationResponse } from '../interfaces/pagination.interface.ts';
import { LoginDataResponse } from '../interfaces/user/login-data.interface.ts';
import { IRefreshTokenResponse } from '../interfaces/session/refresh-token-data.interface.ts';
import { AuthCodeDataResponse } from '../interfaces/user/authcode-data.interface.ts';
import { InterfaceValidatorData } from '../shared/utils/interface-validator.ts';
import { VerifyTwoFactorAuthenticateResponse } from '../interfaces/user/verify-two-factor-response.interface.ts';

export class UserController {

    constructor(
        private userService: UserService,
        private interfaceValidator: InterfaceValidatorData
    ) {

    }

    async create(req: Request, res: Response) {

        const { email, first_name, last_name, password, role } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        const { id } = req.user;
        const userData: CreateUserDto = {
            external_id: randomUUID(),
            email,
            first_name,
            last_name,
            password,
            role
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

    async getUsers(req: Request, res: Response) {

        const {
            id,
            external_id,
            email,
            status,
            initial_date,
            final_date,
            limit,
            offset,
            page,

        } = req.body;

        const options: IUserDataPaginatedDto = {
            id,
            external_id,
            email,
            status,
            initial_date,
            final_date,
            limit,
            offset,
            page,
        }

        const data = await this.userService.getUsers(options);
        const response: ApiResponse<IPaginationResponse<UserWithAccessResponse[]>> = {
            success: true,
            response: {
                details: data
            }
        }
        res.status(200).json(response);
        return;
    }

    async login(req: Request, res: Response) {

        const { user_agent, ip_address } = req.requestDataInfo;
        const { email, password } = req.body;

        const data: LoginDataResponse | AuthCodeDataResponse = await this.userService.login({
            user_agent,
            ip_address,
            email,
            password
        });

        if (this.interfaceValidator.isLoginResponseData(data)) {
            res.cookie('refresh_token', data.refresh_token, {
                httpOnly: true,
                secure: env.node_env === 'production',
                sameSite: 'strict',
                path: '/api/v1/users/refresh-token',
                maxAge: env.session_ttl_days * 24 * 60 * 60 * 1000
            });
        }

        const response: ApiResponse<LoginDataResponse | AuthCodeDataResponse> = {
            success: true,
            response: {
                details: data
            }
        }

        res.status(200).json(response);
        return;
    }

    async setRefreshToken(req: Request, res: Response) {

        const { refresh_token } = req.cookies;
        const data = await this.userService.setRefreshToken(refresh_token);
        const response: ApiResponse<IRefreshTokenResponse> = {
            success: true,
            response: {
                details: data
            }
        }
        res.status(200).json(response);
        return;
    }

    async logout(req: Request, res: Response) {

        const { refresh_token } = req.cookies;
        const { ip_address, user_agent } = req.requestDataInfo;
        await this.userService.logout(refresh_token, ip_address, user_agent);

        // borrar el cookie

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: env.node_env === 'production',
            sameSite: 'strict',
            path: '/api/v1/users/refresh-token',
            maxAge: env.session_ttl_days * 24 * 60 * 60 * 1000
        });

        const response: ApiResponse<null> = {
            success: true,
            response: {
                message: "Se cerro la sesion con exito"
            }
        };
        res.status(200).json(response);
        return;
    }

    async setStatus(req: Request, res: Response) {

        const { id } = req.params;
        const { status } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        await this.userService.setStatus(+id!, status, ip_address, user_agent);

        const response: ApiResponse<null> = {
            success: true,
            response: {
                message: "Se ha actualizado el estado del usuario"
            }
        };

        res.status(200).json(response);
        return;
    }

    async verifyAuthCodeAuthenticator(req: Request, res: Response) {

        const { user_agent, ip_address } = req.requestDataInfo;
        const { challenge_id, auth_code } = req.body;

        const data = await this.userService.verifyTwoFactorAuthenticate(challenge_id, auth_code, ip_address, user_agent);
        const response: ApiResponse<VerifyTwoFactorAuthenticateResponse> = {
            success: true,
            response: {
                message: "Verificacion exitosa",
                details: data
            }
        };
        res.status(200).json(response);
        return;
    }
} 