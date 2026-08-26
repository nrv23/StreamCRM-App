import { CreateRolePermissionDto } from "../../dto/permission/create-role-permission.dto.ts";


export interface IRolePermissionRepository {

    save(dto: CreateRolePermissionDto): Promise<void>
}