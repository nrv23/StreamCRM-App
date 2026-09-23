import { Request, Response } from 'express';
import { ApiResponse } from "../shared/types/api-response.ts";
import { RolesService } from "../services/roles.service.ts";
import { GetRolesResponse } from "../interfaces/user/get-roles.interface.ts";
import { ROLE_PERMISSION_POLICY } from '../shared/utils/rolePermissionDefault.ts';
import { CreateRoleResponse } from '../interfaces/user/create-role-response.interface.ts';

export class RolesController {

    constructor(
        private _rolesService: RolesService
    ) {

    }

    async getAllRoles(_: Request, res: Response) {

        const data = await this._rolesService.getAllRoles();
        const response: ApiResponse<GetRolesResponse[]> = {
            success: true,
            response: {
                details: data
            }
        }

        res.status(200).json(response);
        return;
    }

    async setUserRoles(req: Request, res: Response) {

        const { id } = req.user;
        const { userid } = req.params;
        const { roles, status } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        await this._rolesService.setNewRoles({
            user_id: +userid!,
            current_user_id: id,
            roles,
            status,
            ip_address, user_agent
        })

        const response: ApiResponse<null> = {
            success: true,
            response: {
                message: 'Roles actualizados correctamente'
            }
        }

        res.status(200).json(response);
        return;
    }

    async createRole(req: Request, res: Response) {

        const { id: user_id } = req.user;
        const { role, permissions, description } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        const is_system = Object.keys(ROLE_PERMISSION_POLICY).includes(role);

        const data = await this._rolesService.createRole(
            role, permissions, description, is_system, ip_address, user_agent, user_id
        );

        const response: ApiResponse<CreateRoleResponse> = {
            success: true,
            response: {
                message: "Role creado con exito",
                details: data
            }
        }

        res.status(201).json(response);
        return;
    }
}