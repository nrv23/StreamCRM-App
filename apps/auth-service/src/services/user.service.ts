import { UnitOfWork } from "../config/unitOfWork.ts";
import { CreateUserDto } from "../dto/user/create-user.dto.ts";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.ts";
import { ROLE_PERMISSION_POLICY } from "../shared/utils/rolePermissionDefault.ts";
import { CREATE_USER } from "../shared/types/events.type.ts";
import { env } from "../config/enviroment.ts";
import { EntityType } from "../enum/EntityType.enum.ts";
import { UserStatus } from "../enum/UserStatus.enum.ts";

export class UserService {

    constructor(
        public unitOfWork: UnitOfWork,
        public passwordHasher: IPasswordHasher
    ) {

    }
    createUser(dto: CreateUserDto, user_id: number, ip_address: string, user_agent: string) {

        return this.unitOfWork.execute(async ({ userRoles, users, events, rolePermissions, auditLogs }) => {

            // validar que exista por email 
            const newUser = await users.save({
                external_id: dto.external_id,
                email: dto.email,
                password: await this.passwordHasher.hash(dto.password),
                first_name: dto.first_name,
                last_name: dto.last_name,
            });

            await Promise.all([
                userRoles.save(newUser.id, [ROLE_PERMISSION_POLICY.viewer.roleId]),
                rolePermissions.save({
                    roleId: ROLE_PERMISSION_POLICY.viewer.roleId,
                    permissionIds: ROLE_PERMISSION_POLICY.viewer.permissions
                }),
                events.save({
                    event_id: newUser.external_id,
                    event_name: CREATE_USER,
                    aggregate_id: newUser.id,
                    aggregate_type: EntityType.USER,
                    payload: {
                        id: newUser.id,
                        external_id: newUser.external_id,
                        email: newUser.email,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        status: UserStatus.active, // cambiar a un status enum
                        event: CREATE_USER,
                        user_id
                    },
                    headers: {
                        source: env.service_name,
                        version: env.api_version,
                    }
                }),
                // agregar aqui el audit logs
                auditLogs.save({
                    entity_type: EntityType.USER,
                    entity_id: newUser.id,
                    action: CREATE_USER,
                    user_id,
                    old_values: {},
                    new_values: newUser,
                    ip_address,
                    user_agent
                })
            ]);

            return newUser;
        })
    }
}