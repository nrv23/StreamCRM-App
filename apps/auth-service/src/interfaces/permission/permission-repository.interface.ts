import { CreatePermissionDto } from "../../dto/permission/create-permission.dto.ts";
import { GetDelegablePermissionsDto } from "../../dto/permission/get-delegable-permissions.dto.ts";
import { Permission } from "../../entity/permission/Permission.entity.ts";
import { GetAllPermissionsResponse } from "./get-permission.interface.ts";


export interface IPermissionRepository {

    save(dto: CreatePermissionDto): Promise<Permission>;
    getAllPermissions(): Promise<GetAllPermissionsResponse[]>;
    hasDelegablePermissions(dto: GetDelegablePermissionsDto): Promise<boolean>
    //  saveCustomePermissions(dto: CustomePermissions[]): Promise<void>;
}