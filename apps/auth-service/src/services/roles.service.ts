import { Logger } from "winston";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { GetRolesResponse } from "../interfaces/user/get-roles.interface.ts";
import { ValidateRolesDto } from "../dto/permission/validate-roles.dto.ts";
import { ErrorFactory } from "../shared/factory/error-factory.ts";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";

export class RolesService {

    constructor(
        private _unitOfWork: UnitOfWork,
        private _logger: Logger
    ) {

    }

    async getAllRoles(): Promise<GetRolesResponse[]> {

        const roles = await this._unitOfWork.execute(async ({ roles }) => await roles.getAllRoles());
        const log: ILogMetadata = {
            created_at: new Date().toISOString(),
            payload: JSON.parse(JSON.stringify(roles)),
            method: 'GET',
            route: '/v1/roles/',
            service: env.service_name
        };
        this._logger.log('Get all roles', log);
        return roles;
    }

    async validateRoles(dto: ValidateRolesDto) {
        return this._unitOfWork.execute(async ({ roles, users }) => {

            const searchUserResponse = await users.findbyId(dto.user_id); // usuario consultado 

            if (!searchUserResponse) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'User not exists');
            if (dto.current_user_id !== searchUserResponse.id)
                throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'The current user and the user being queried cannot be the same');

            const validRoles = await roles.validateRoles(dto);

            if (!validRoles.length)
                throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'The user sent havent roles or are inactive');

            if (!(await roles.validateUserRolesMatch(dto.user_id, dto.roles)))
                throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Uno o varios roles enviados no pertencen al usuario consultado');

            // aqui se actualizan los roles

        });
    }


}