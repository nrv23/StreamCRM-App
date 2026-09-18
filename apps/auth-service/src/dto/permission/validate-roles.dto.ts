import { RoleStatus } from "../../enum/RoleStatus.enum.ts";


export interface ValidateRolesDto {
    current_user_id: number;
    user_id: number;
    status: RoleStatus;
    roles: number[];
}