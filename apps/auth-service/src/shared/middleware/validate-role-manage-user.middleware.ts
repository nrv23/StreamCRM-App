import { NextFunction, Request, Response } from "express";
import { ErrorFactory } from "../factory/error-factory.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { UserStatus } from "../../enum/UserStatus.enum.ts";
import { UnitOfWork } from "../../config/unitOfWork.ts";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";

const uow = new UnitOfWork();

export function requirePermission(permissionCode: string) {
    return async (
        req: Request,
        _: Response,
        next: NextFunction
    ) => {
        await uow.execute(async ({ users, rolePermissions }) => {
            const { id: currentUserId } = req.user;

            const currentUser = await users.findbyId(currentUserId);

            if (!currentUser) {
                throw ErrorFactory.build(
                    ApiErrorCode.NOT_FOUND,
                    "Current user not found"
                );
            }

            if (currentUser.status !== UserStatus.active) {
                throw ErrorFactory.build(
                    ApiErrorCode.FORBIDDEN,
                    "Current user is not active"
                );
            }

            const allowed = await rolePermissions.hasAllowedPermission(
                currentUserId,
                permissionCode,
                RoleStatus.active
            );

            if (!allowed) {
                throw ErrorFactory.build(
                    ApiErrorCode.FORBIDDEN,
                    // `Missing required permission: ${permissionCode}`
                    'Unauthorized for this action'
                );
            }
        });

        next();
    };
}