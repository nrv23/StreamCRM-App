import { PermissionsService } from "../services/permissions.service.ts";
import { Request, Response } from 'express';
import { ApiResponse } from "../shared/types/api-response.ts";
import { GetAllPermissionsResponse } from "../interfaces/permission/get-permission.interface.ts";

export class PermissionsController {

    constructor(
        private _permissionsService: PermissionsService
    ) {

    }

    async getAllPermissions(_: Request, res: Response) {

        const data = await this._permissionsService.getAllPermissions();
        const response: ApiResponse<GetAllPermissionsResponse[]> = {
            success: true,
            response: {
                details: data
            }
        }

        res.status(200).json(response);
        return;
    }

    async setNewPermissions(req: Request, res: Response) {

        const { id } = req.user;
        const { user_id } = req.params;
        const { role_id, permissions, status } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;

        await this._permissionsService.setNewPermissions({
            user_id: +id,
            update_user_id: +user_id!,
            role_id: +role_id!,
            permissions,
            status,
            ip_address,
            user_agent
        });

        const response: ApiResponse<null> = {
            success: true,
            response: {
                message: 'Permisos actualizados correctamente'
            }
        };

        res.status(200).json(response);
        return;
    }
}