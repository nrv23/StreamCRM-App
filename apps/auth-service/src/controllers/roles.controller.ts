import { Request, Response } from 'express';
import { ApiResponse } from "../shared/types/api-response.ts";
import { RolesService } from "../services/roles.service.ts";
import { GetRolesResponse } from "../interfaces/user/get-roles.interface.ts";

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
}