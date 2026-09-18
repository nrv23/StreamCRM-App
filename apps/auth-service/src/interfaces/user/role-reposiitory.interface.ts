import { ValidateRolesDto } from "../../dto/permission/validate-roles.dto.ts";
import { CreateRoleDto } from "../../dto/user/create-role.dto.ts";
import { Role } from "../../entity/user/Role.entity.ts";
import { GetRolesResponse } from "./get-roles.interface.ts";
import { ValidateRolesResponse } from "./validate-roles.interface.ts";

export interface IRoleRepository {

    save(dto: CreateRoleDto): Promise<Role>;
    getAllRoles(): Promise<GetRolesResponse[]>;
    validateRoles(dto: ValidateRolesDto): Promise<ValidateRolesResponse[]>;
    validateUserRolesMatch(user_id: number, role_ids: number[]): Promise<boolean>;
}

// se crean roles 
// se cambia su estado
// se listan todos o por usuario 
// actualizar role