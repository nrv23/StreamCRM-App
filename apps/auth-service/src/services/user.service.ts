import { randomUUID } from "node:crypto";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { CreateUserDto } from "../dto/user/create-user.dto.ts";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.ts";
import { ROLE_PERMISSION_POLICY } from "../shared/utils/rolePermissionDefault.ts";



export class UserService {

    constructor(
        public unitOfWork: UnitOfWork,
        public passwordHasher: IPasswordHasher
    ) {

    }


    createUser(dto: CreateUserDto) {

        return this.unitOfWork.execute(async ({ userRoles, users, events, rolePermissions }) => {

            // validar que exista por email 
            const external_id = randomUUID();
            const newUser = await users.save({
                external_id,
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
                events.save({})
            ])
        })
    }
}