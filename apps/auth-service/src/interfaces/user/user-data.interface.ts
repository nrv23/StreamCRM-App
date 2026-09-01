import { GetPermisssionsResponse } from "../../repository/permission/role-permission.repository.ts";
import { GetUserResponse } from "../../repository/user/user.repository.ts";
import { GetUserRolesResponse } from "../../repository/user/user_role.repository.ts";


export interface IUserDataResponse {
    user: GetUserResponse;
    roles: GetUserRolesResponse[];
    permissions: string[];
}