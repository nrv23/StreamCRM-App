import { Logger } from "winston";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { GetAllPermissionsResponse } from "../interfaces/permission/get-permission.interface.ts";
import { env } from "../config/enviroment.ts";




export class PermissionsService {

    constructor(
        private _unitOfWork: UnitOfWork,
        private _logger: Logger
    ) {

    }

    async getAllPermissions(): Promise<GetAllPermissionsResponse[]> {

        const permissions = await this._unitOfWork.execute(async ({ permissions }) => await permissions.getAllPermissions());
        const log: ILogMetadata = {
            created_at: new Date().toISOString(),
            payload: JSON.parse(JSON.stringify(permissions)),
            method: 'GET',
            route: '/v1/permissions/',
            service: env.service_name
        };
        this._logger.log('Get all permissions', log);
        return permissions;
    }
}