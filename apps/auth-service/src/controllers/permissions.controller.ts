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
}