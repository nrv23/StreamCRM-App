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
import { CREATE_ROLE, SET_USER_ROLES } from "../shared/types/events.type.ts";
import { CreateRoleResponse } from "../interfaces/user/create-role-response.interface.ts";


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

    async setNewRoles(dto: ValidateRolesDto): Promise<void> {
        return this._unitOfWork.execute(async ({ roles, users, userRoles, auditLogs }) => {

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
            ]);

            const log: ILogMetadata = {
                created_at: new Date().toISOString(),
                method: 'PATCH',
                route: '/v1/roles/:userid',
                service: env.service_name,
                payload: {
                    newRoles: JSON.stringify(dto.roles),
                    currentUser: dto.current_user_id,
                    searchUser: dto.user_id
                },
                event: SET_USER_ROLES,

            };
            this._logger.log('set user roles', log);
        });
    }

    async createRole(roleName: string,
        permissionCodes: string[],
        description: string,
        is_system: boolean,
        ip_address: string,
        user_agent: string,
        user_id: number
    ): Promise<CreateRoleResponse> {

        return this._unitOfWork.execute(async ({ roles, rolePermissions, permissions, auditLogs }) => {


            const role = await roles.getRoleByName(roleName);

            if (role) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'Role already exists');

            const hasDelegablePermissions = await permissions.hasDelegablePermissions({
                permissions: permissionCodes.map(permission => ({
                    code: permission
                }))
            });

            if (!hasDelegablePermissions) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'Permission must be exists and are delegable');

            // crear el rol 
            const newRole = await roles.save({
                name: roleName,
                description: description,
                is_system: is_system
            });
            // crear los permisos

            await rolePermissions.save({
                roleId: newRole.id,
                permissionIds: permissionCodes
            });
            // crear el audito log 
            auditLogs.save({
                entity_type: EntityType.ROLE,
                entity_id: newRole.id,
                action: CREATE_ROLE,
                user_id: user_id,
                old_values: {

                },
                new_values: {
                    newRole: JSON.stringify(newRole),
                    newPermissions: JSON.stringify({
                        permissions: permissionCodes
                    })
                },
                ip_address: ip_address,
                user_agent: user_agent
            })
            const log: ILogMetadata = {
                created_at: new Date().toISOString(),
                method: 'POST',
                route: '/api/v1/roles/',
                service: env.service_name,
                payload: {
                    newRole: JSON.stringify(newRole),
                    newPermissions: JSON.stringify({
                        permissions: permissionCodes
                    })
                },
                event: CREATE_ROLE,

            };
            this._logger.log('set user roles', log);

            const response: CreateRoleResponse = {
                role: newRole,
                permissions: permissionCodes
            }


            return response;
        });
    }
}