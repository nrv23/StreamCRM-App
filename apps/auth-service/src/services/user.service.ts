import { UnitOfWork } from "../config/unitOfWork.ts";
import { CreateUserDto } from "../dto/user/create-user.dto.ts";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.ts";
import { ROLE_PERMISSION_POLICY } from "../shared/utils/rolePermissionDefault.ts";
import { CREATE_USER } from "../shared/types/events.type.ts";
import { env } from "../config/enviroment.ts";
import { EntityType } from "../enum/EntityType.enum.ts";
import { UserStatus } from "../enum/UserStatus.enum.ts";
import { ErrorFactory } from "../shared/factory/error-factory.ts";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";
import { IUserDataResponse } from "../interfaces/user/user-data.interface.ts";
import { IUserDataPaginatedDto } from "../interfaces/user/user-data-paginated.interface.ts";
import { UserWithAccessResponse } from "../repository/user/user.repository.ts";
import { IPaginationResponse } from "../interfaces/pagination.interface.ts";
import { LoginDto } from "../dto/user/login.dto.ts";
import { randomUUID } from "node:crypto";
import { ITokenManager } from "../interfaces/token/token-payload.interface.ts";

export class UserService {

    constructor(
        public unitOfWork: UnitOfWork,
        public passwordHasher: IPasswordHasher,
        public tokenManager: ITokenManager
    ) {

    }
    createUser(dto: CreateUserDto, user_id: number, ip_address: string, user_agent: string) {

        return this.unitOfWork.execute(async ({ userRoles, users, events, rolePermissions, auditLogs }) => {

            // validar que exista por email 
            const currentUser = await users.findbyEmail(dto.email);
            if (currentUser) throw ErrorFactory.build(ApiErrorCode.USER_EMAIL_DUPLICATED, 'User already exists');

            const newUser = await users.save({
                external_id: dto.external_id,
                email: dto.email,
                password: await this.passwordHasher.hash(dto.password),
                first_name: dto.first_name,
                last_name: dto.last_name,
            });

            await Promise.all([
                userRoles.save(newUser.id, [ROLE_PERMISSION_POLICY.viewer.roleId]),
                rolePermissions.save({
                    roleId: ROLE_PERMISSION_POLICY.viewer.roleId,
                    permissionIds: ROLE_PERMISSION_POLICY.viewer.permissions
                }),
                events.save({
                    event_id: newUser.external_id,
                    event_name: CREATE_USER,
                    aggregate_id: newUser.id,
                    aggregate_type: EntityType.USER,
                    payload: {
                        id: newUser.id,
                        external_id: newUser.external_id,
                        email: newUser.email,
                        first_name: newUser.first_name,
                        last_name: newUser.last_name,
                        status: UserStatus.active, // cambiar a un status enum
                        event: CREATE_USER,
                        user_id
                    },
                    headers: {
                        source: env.service_name,
                        version: env.api_version,
                    }
                }),
                // agregar aqui el audit logs
                auditLogs.save({
                    entity_type: EntityType.USER,
                    entity_id: newUser.id,
                    action: CREATE_USER,
                    user_id,
                    old_values: {},
                    new_values: newUser,
                    ip_address,
                    user_agent
                })
            ]);

            return newUser;
        })
    }

    async getMe(user_id: number): Promise<IUserDataResponse> {

        return await this.unitOfWork.execute(async ({ users, userRoles, rolePermissions }) => {

            const currentUser = await users.findbyId(user_id);
            if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'User not exists');

            const roles = await userRoles.getRolesByUserId(currentUser.id);
            const permissions = await rolePermissions.getPermissionsByRoleIdAndUserId(currentUser.id);

            //delete currentUser.password;

            const response: IUserDataResponse = {
                user: currentUser,
                roles,
                permissions: permissions.map(permission => permission.code)
            }
            return response;
        })
    }

    async getUsers(options: IUserDataPaginatedDto): Promise<IPaginationResponse<UserWithAccessResponse[]>> {
        return await this.unitOfWork.execute(async ({ users }) => {

            const limit = options.limit && options.limit <= 30 ? options.limit : 30;
            const page = options.page || 1;
            const offset = (page - 1) * limit;

            options.limit = limit;
            options.offset = offset;
            options.page = page;

            const [data, totalItems] = await Promise.all([users.findUsersPaginated(options), users.getRecordsCount(options)]);
            const totalPages = Math.ceil(totalItems / limit);
            const prevPage = page! > 1 ? page! - 1 : null;
            const nextPage = page! < totalPages ? page! + 1 : null;
            const response: IPaginationResponse<UserWithAccessResponse[]> = {
                data,
                paginationData: {
                    page: +page,
                    pageSize: +data.length,
                    totalPages,
                    totalRecords: totalItems,
                    previousPage: prevPage!,
                    nextPage: nextPage!
                }
            }

            return response;
        });
    }

    async login(dto: LoginDto) {

        return await this.unitOfWork.execute(async ({ users, userRoles, rolePermissions, sessions }) => {

            const currentUser = await users.findbyEmail(dto.email);

            if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Invalid authentication credentials');
            if (currentUser.status === UserStatus.blocked) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User  account is blocked');
            if (currentUser.status === UserStatus.inactive) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is inactive');

            const isValidPass = await this.passwordHasher.verify(dto.password, currentUser.password!.toString());

            if (!isValidPass) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Invalid authentication credentials');

            const session_id = randomUUID();
            const expiresAt = Date.now() + 15 * 60 * 1000;


            // crear el token de sesion
            const token = await this.tokenManager.sign({
                sid: session_id,
                exp: expiresAt,
                uid: currentUser.id,
                sub: currentUser.external_id
            });

            // crear el registro de la session en la tabla sesiones para trazabilidad e historicos.

            delete currentUser.password;

            const [roles, permissions, _] = await Promise.all([
                userRoles.getRolesByUserId(currentUser.id),
                rolePermissions.getPermissionsByRoleIdAndUserId(currentUser.id),
                sessions.save({
                    user_id: currentUser.id,
                    user_agent: dto.user_agent,
                    ip_address: dto.ip_address,
                    session_id
                })
            ]);

            const response: IUserDataResponse = {
                user: currentUser,
                roles,
                permissions: permissions.map(permission => permission.code)
            }
            return response;
        })
    }
}