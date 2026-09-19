import { CreateRolePermissionDto } from "../../dto/permission/create-role-permission.dto.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";
import { GetPermisssionsResponse } from "../../repository/permission/role-permission.repository.ts";


export interface IRolePermissionRepository {

    save(dto: CreateRolePermissionDto): Promise<void>;
    getPermissionsByRoleIdAndUserId(user_id: number): Promise<GetPermisssionsResponse[]>;
    hasAllowedPermission(user_id: number, permission_code: string, status: RoleStatus): Promise<Boolean>;
}