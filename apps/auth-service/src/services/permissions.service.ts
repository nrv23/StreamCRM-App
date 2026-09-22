import { Logger } from "winston";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { GetAllPermissionsResponse } from "../interfaces/permission/get-permission.interface.ts";
import { env } from "../config/enviroment.ts";
import { SetNewPermissions } from "../dto/permission/set-new-permissions.dto.ts";
import { ErrorFactory } from "../shared/factory/error-factory.ts";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";
import { UserStatus } from "../enum/UserStatus.enum.ts";
import { EntityType } from "../enum/EntityType.enum.ts";
import { SET_USER_PERMISSIONS } from "../shared/types/events.type.ts";

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

    async setNewPermissions(dto: SetNewPermissions): Promise<void> {
        return this._unitOfWork.execute(async ({ roles, users, auditLogs, rolePermissions }) => {

            const searchUser = await users.findbyId(dto.update_user_id);
            if (!searchUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'user being queried must be exists');
            if (searchUser?.status !== UserStatus.active) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'user being queried is not active');

            // validar role
            const currentRole = await roles.getRole(dto.role_id, dto.update_user_id);
            if (!currentRole) throw ErrorFactory.build(ApiErrorCode.FORBIDDEN, 'Role not found');
            if (currentRole.is_system) throw ErrorFactory.build(ApiErrorCode.FORBIDDEN, 'It can be posible update system role');

            // validar permisos
            // validar el query para validar permisos actuales del actor con los enviados del update user id
            const hasAllPermissions = await rolePermissions.hasAllPermissions({
                user_id: dto.user_id,
                permissions: dto.permissions,
                status: dto.status
            });

            if (!hasAllPermissions) throw ErrorFactory.build(ApiErrorCode.FORBIDDEN, 'all permissions must be delegable');

            const currentPermissions = await rolePermissions.getPermissionsByRoleIdAndUserId(dto.update_user_id);
            const newPermissionsCode = dto.permissions.map(p => p.code);

            /*
                validar permisos de usuario actor con usuario a editar los permisos. 

                Cualquier permiso del usuario a editar debe estar dentro de los permisos del usuario actor.
                Uno o todos los enviados al usuario a editar deben estar dentro de los permisos del usuario actor.

                Ejemplo:
                Usuario actor tiene permisos [1, 2, 3]
                Usuario a editar tiene permisos [1, 2]

                1. Si envia [1, 2] a editar
                    - 1 es comun para ambos
                    - 2 es comun para ambos
                    -> OK
                2. Si envia [1, 3] a editar
                    - 1 es comun para ambos
                    - 3 no es comun para ambos
                    -> FORBIDDEN
                3. Si envia [1, 2, 3] a editar
                    - 1 es comun para ambos
                    - 2 es comun para ambos
                    - 3 es comun para ambos
                    -> OK
                4. Si envia [4] a editar
                    - 4 no es comun para ambos
                    -> FORBIDDEN
            */

            // delete current permissions
            await rolePermissions.deleteRolePermissionsByRoleId(currentRole.id);



            await Promise.all([
                // save new permissions
                rolePermissions.save({
                    roleId: currentRole.id,
                    permissionIds: newPermissionsCode
                }),
                auditLogs.save({
                    entity_type: EntityType.PERMISSION,
                    entity_id: dto.update_user_id,
                    action: SET_USER_PERMISSIONS,
                    user_id: dto.user_id,
                    old_values: {
                        prevPermissions: JSON.stringify(currentPermissions.map(pe => pe.code))
                    },
                    new_values: {
                        newPermissions: JSON.stringify(dto.permissions)
                    },
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent
                })
            ]);

            const log: ILogMetadata = {
                created_at: new Date().toISOString(),
                method: 'PATCH',
                route: '/v1/permissions/:userid',
                service: env.service_name,
                payload: {
                    newPermissions: JSON.stringify(dto.permissions),
                    currentUser: dto.user_id,
                    searchUser: dto.update_user_id
                },
                event: SET_USER_PERMISSIONS,
            };
            this._logger.log('set user permissions', log);
        });
    }
}