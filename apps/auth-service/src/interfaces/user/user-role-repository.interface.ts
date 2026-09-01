import { GetUserRolesResponse } from "../../repository/user/user_role.repository.ts";


export interface IUserRoleRepository {

    save(user_id: number, role_Ids: number[]): Promise<void>;
    getRolesByUserId(user_id: number): Promise<GetUserRolesResponse[]>
}