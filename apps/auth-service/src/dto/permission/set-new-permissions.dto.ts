import { ValidateAllPermissionsDto } from "./validate-all-permissions.dto.ts";


export interface SetNewPermissions extends ValidateAllPermissionsDto {
    role_id: number;
    ip_address: string;
    user_agent: string;
    update_user_id: number;
}