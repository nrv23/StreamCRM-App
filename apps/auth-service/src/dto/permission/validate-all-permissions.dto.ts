import { RoleStatus } from "../../enum/RoleStatus.enum.ts";


export interface ValidateAllPermissionsDto {

    user_id: number,
    status: RoleStatus,
    permissions: {
        code: string;
    }[]
}