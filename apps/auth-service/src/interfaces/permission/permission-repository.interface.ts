import { CreatePermissionDto } from "../../dto/permission/create-permission.dto.ts";
import { Permission } from "../../entity/permission/Permission.entity.ts";


export interface IPermissionRepository {

    save(dto: CreatePermissionDto): Promise<Permission>
}