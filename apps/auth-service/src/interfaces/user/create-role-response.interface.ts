import { Role } from "../../entity/user/Role.entity.ts";


export interface CreateRoleResponse {
    role: Role,
    permissions: string[]
}