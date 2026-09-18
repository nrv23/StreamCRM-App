import { RoleStatus } from "../../enum/RoleStatus.enum.ts";


export interface GetRolesResponse {

    id: number;
    name: string;
    description: string;
    created_at: string;
    status: RoleStatus;
    is_system: boolean
}