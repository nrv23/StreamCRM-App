import { CreatePermissionDto } from "../../dto/permission/create-permission.dto.ts";
import { Permission } from "../../entity/permission/Permission.entity.ts";
import { GetAllPermissionsResponse } from "./get-permission.interface.ts";


export interface IPermissionRepository {

    save(dto: CreatePermissionDto): Promise<Permission>;
    getAllPermissions(): Promise<GetAllPermissionsResponse[]>;
    //  saveCustomePermissions(dto: CustomePermissions[]): Promise<void>;
}