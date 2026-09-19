import { CreateRoleDto } from "./create-role.dto.ts";


export interface CreateUserRolePermissionsDto {
    role: CreateRoleDto,
    permissions: CustomePermissions[];
}

export interface CustomePermissions {
    permission: {
        code: string;
        description: string;
    }
}