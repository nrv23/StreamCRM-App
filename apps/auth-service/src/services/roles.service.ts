import { Logger } from "winston";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { env } from "../config/enviroment.ts";
import { GetRolesResponse } from "../interfaces/user/get-roles.interface.ts";
import { ValidateRolesDto } from "../dto/permission/validate-roles.dto.ts";
import { ErrorFactory } from "../shared/factory/error-factory.ts";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";
import { UserStatus } from "../enum/UserStatus.enum.ts";
import { EntityType } from "../enum/EntityType.enum.ts";
import { SET_USER_ROLES } from "../shared/types/events.type.ts";
import { RoleStatus } from "../enum/RoleStatus.enum.ts";

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

    async setNewRoles(dto: ValidateRolesDto) {
        return this._unitOfWork.execute(async ({ roles, users, userRoles, auditLogs, rolePermissions }) => {

            const searchUser = await users.findbyId(dto.user_id);

            if (!searchUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'user being queried must be exists');
            if (searchUser?.status !== UserStatus.active) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'user being queried is not active');

            if (dto.current_user_id === searchUser.id) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'The current user and the user being queried cannot be the same');

            const [searchUseCurrentRoles, validRoles] = await Promise.all([
                userRoles.getRolesByUserId(dto.user_id),
                roles.validateRoles(dto)
            ])

            if (validRoles.length !== dto.roles.length)
                throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Some role sent are not valid or active');

            // aqui se actualizan los roles
            const newRoles = validRoles.map(role => role.id);

            await Promise.all([
                userRoles.replaceUserRoles(dto.user_id, newRoles),
                auditLogs.save({
                    entity_type: EntityType.ROLE,
                    entity_id: dto.user_id,
                    action: SET_USER_ROLES,
                    user_id: dto.user_id,
                    old_values: {
                        preRoles: JSON.stringify(searchUseCurrentRoles.map(role => role.id))
                    },
                    new_values: {
                        newRoles: JSON.stringify(dto.roles)
                    },
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent
                })
            ])
        });
    }


}