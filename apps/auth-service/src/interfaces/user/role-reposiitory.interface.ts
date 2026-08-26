import { CreateRoleDto } from "../../dto/user/create-role.dto.ts";
import { Role } from "../../entity/user/Role.entity.ts";

export interface IRoleRepository {

    save(dto: CreateRoleDto): Promise<Role>;
}

// se crean roles 
// se cambia su estado
// se listan todos o por usuario 
// actualizar role