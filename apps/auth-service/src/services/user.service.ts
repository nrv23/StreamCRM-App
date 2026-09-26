import { UnitOfWork } from "../config/unitOfWork.ts";
import { CreateUserDto } from "../dto/user/create-user.dto.ts";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.ts";
import { ROLE_PERMISSION_POLICY } from "../shared/utils/rolePermissionDefault.ts";
import { CHANGE_USER_STATUS, CREATE_USER, GET_ME, GET_USERS, LOGIN_USER, LOGOUT_USER, NEW_AUTH_CODE } from "../shared/types/events.type.ts";
import { env } from "../config/enviroment.ts";
import { EntityType } from "../enum/EntityType.enum.ts";
import { UserStatus } from "../enum/UserStatus.enum.ts";
import { ErrorFactory } from "../shared/factory/error-factory.ts";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";
import { IUserDataResponse } from "../interfaces/user/user-data.interface.ts";
import { IUserDataPaginatedDto } from "../interfaces/user/user-data-paginated.interface.ts";
import { CreateUserReponse, GetUserResponse, UserWithAccessResponse } from "../repository/user/user.repository.ts";
import { IPaginationResponse } from "../interfaces/pagination.interface.ts";
import { LoginDto } from "../dto/user/login.dto.ts";
import { randomUUID } from "node:crypto";
import { ITokenManager } from "../interfaces/token/token-payload.interface.ts";
import { LoginDataResponse } from "../interfaces/user/login-data.interface.ts";
import { RefreshTokenStatus } from "../enum/RefreshTokenStatus.enum.ts";
import { IRefreshTokenResponse } from "../interfaces/session/refresh-token-data.interface.ts";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";
import { RoleStatus } from "../enum/RoleStatus.enum.ts";
import { AuthCodeDataResponse } from "../interfaces/user/authcode-data.interface.ts";
import { CreateAuthCodeDto } from "../dto/user/create-auth-code.dto.ts";
import { IDobleAuthenticateRepositpry } from "../interfaces/user/doble-authenticate.interface.ts";
import { AuthCodeStatus } from "../enum/AuthCodeStatus.enum.ts";
import { AuthCodePurpose } from "../enum/AuthCodePurpose.enum.ts";
import { AuthCodeChannel } from "../enum/AuthCodeChannel.enum.ts";
import { ISecretHasher } from "../interfaces/user/auhtcode-hash.interface.ts";
import { LockAuthCodeReasons } from "../enum/LockAuthCodeReasons.enum.ts";
import { IUserRoleRepository } from "../interfaces/user/user-role-repository.interface.ts";
import { IRolePermissionRepository } from "../interfaces/permission/role-permission.interface.ts";
import { ISessionRepository } from "../interfaces/session/session-repository.interface.ts";
import { IRefreshTokenRepository } from "../interfaces/session/refresh-token-repository.interface.ts";
import { VerifyTwoFactorAuthenticateResponse } from "../interfaces/user/verify-two-factor-response.interface.ts";

export class UserService {

    constructor(
        private unitOfWork: UnitOfWork,
        private passwordHasher: IPasswordHasher,
        private tokenManager: ITokenManager,
        private secretHasher: ISecretHasher,
        private _logger: Logger
    ) {

    }
    createUser(dto: CreateUserDto, user_id: number, ip_address: string, user_agent: string): Promise<CreateUserReponse> {
        // aqio solamente entran los superadmin
        return this.unitOfWork.execute(async ({ userRoles, users, events, auditLogs, roles }) => {

            // validar que exista por email 
            const currentUser = await users.findbyEmail(dto.email);

            if (currentUser) throw ErrorFactory.build(ApiErrorCode.USER_EMAIL_DUPLICATED, 'User already exists');

            const role = await roles.getRoleByNameAndStatus(dto.role!, RoleStatus.active);

            if (!role) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'Role is not found or inactive');

            const newUser = await users.save({
                external_id: dto.external_id,
                email: dto.email,
                password: await this.passwordHasher.hash(dto.password),
                first_name: dto.first_name,
                last_name: dto.last_name,
            });

            await Promise.all([
                userRoles.save(newUser.id, [role.id]),
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
                        user_id,
                        roles: role
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
                    new_values: {
                        ...newUser,
                        roles: role
                    },
                    ip_address,
                    user_agent
                })
            ]);

            const log: ILogMetadata = {
                service: env.service_name,
                event: CREATE_USER,
                entity_id: newUser.id,
                method: 'POST',
                route: 'api/v1/users',
                created_at: new Date().toISOString(),
                event_id: newUser.external_id
            };

            this._logger.info('user created', log);

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

            const log: ILogMetadata = {
                service: env.service_name,
                event: GET_ME,
                entity_id: currentUser.id,
                method: 'POST',
                route: 'api/v1/users/me',
                created_at: new Date().toISOString(),
                payload: {
                    user: response.user,
                    roles: JSON.stringify(response.roles),
                    permissions: JSON.stringify(response.permissions)
                }
            };

            this._logger.info('get me profile', log);

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

            const log: ILogMetadata = {
                service: env.service_name,
                event: GET_USERS,
                method: 'POST',
                route: 'api/v1/users/filtered',
                created_at: new Date().toISOString(),
                payload: {
                    users: JSON.stringify(response.data),
                    paginationData: JSON.stringify(response.paginationData)
                }
            };

            this._logger.info('get users', log);

            return response;
        });
    }

    private async createAuthCode(user_id: number, dobleFactorAuth: IDobleAuthenticateRepositpry) {
        const authcode_expires_at = new Date(Date.now() + 15 * 60 * 1000);
        const external_id = randomUUID();
        const { authcode } = await dobleFactorAuth.getNewCodeAuthenticator();
        const newAuthCodeBody: CreateAuthCodeDto = {
            external_id,
            user_id,
            expires_at: authcode_expires_at,
            status: AuthCodeStatus.active,
            purpose: AuthCodePurpose.login_2fa,
            channel: AuthCodeChannel.email,
            code_hash: await this.secretHasher.hash(authcode)
        }

        const response = await dobleFactorAuth.saveCodeAuthenticator(newAuthCodeBody);

        const log: ILogMetadata = {
            service: env.service_name,
            event: NEW_AUTH_CODE,
            entity_id: response.id,
            method: 'POST',
            route: 'api/v1/users/login',
            created_at: new Date().toISOString(),
            payload: {
                auth_code_external_id: external_id,
                status: AuthCodeStatus.active,
                purpose: AuthCodePurpose.login_2fa,
                channel: AuthCodeChannel.email,
                user_id
            }
        };
        this._logger.info('getting code authenticator', log);


        return { external_id, authcode, authcodeid: response.id }
    }

    private async createSession(
        currentUser: GetUserResponse,
        ip_address: string,
        user_agent: string,
        userRoles: IUserRoleRepository,
        rolePermissions: IRolePermissionRepository,
        sessions: ISessionRepository,
        refreshTokens: IRefreshTokenRepository
    ): Promise<LoginDataResponse> {
        const session_id = randomUUID();
        const session_expires_at = new Date(
            Date.now() + env.session_ttl_days * 24 * 60 * 60 * 1000
        );
        const token_expires_at = Math.floor(Date.now() / 1000) + 15 * 60;
        const refresh_token = this.tokenManager.refreshToken();

        delete currentUser.password;

        const [roles, permissions, token, _, __] = await Promise.all([
            userRoles.getRolesByUserId(currentUser.id),
            rolePermissions.getPermissionsByRoleIdAndUserId(currentUser.id),
            this.tokenManager.sign({
                sid: session_id,
                uid: currentUser.id,
                sub: currentUser.external_id
            }),
            sessions.save({
                user_id: currentUser.id,
                user_agent,
                ip_address,
                session_id,
                expires_at: session_expires_at
            }),
            refreshTokens.save({
                user_id: currentUser.id,
                expires_at: session_expires_at,
                session_id,
                token_hash: refresh_token
            })
        ]);

        return {
            access_token: token,
            refresh_token,
            expires_at: token_expires_at,
            user: currentUser,
            roles,
            permissions: permissions.map(permission => permission.code)
        };
    }

    async login(dto: LoginDto): Promise<LoginDataResponse | AuthCodeDataResponse> {

        return await this.unitOfWork.execute(async ({ users, userRoles, rolePermissions, sessions, refreshTokens, auditLogs, dobleFactorAuth }) => {

            const currentUser = await users.findbyEmail(dto.email);

            if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Invalid authentication credentials');
            if (currentUser.status === UserStatus.blocked) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User  account is blocked');
            if (currentUser.status === UserStatus.inactive) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is inactive');

            const isValidPass = await this.passwordHasher.verify(dto.password, currentUser.password!.toString());

            if (!isValidPass) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Invalid authentication credentials');
            // debe preguntar si 2fa esta habilitado, sino lo esta genera el login, siempre y cuando no exista un bloqueo.

            // si el 2fa esta habilitado sin bloqueo entonces genera el codigo y retorna external id con el codigo.
            const [{ isEnabled }, { isLocked }] = await Promise.all([
                dobleFactorAuth.isEnabledTwoFactorAuthenticator(currentUser.id),
                dobleFactorAuth.isLockedTwoFactorAuthenticator(currentUser.id)
            ]);

            if (isLocked) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Two factor authentication is locked/unavailable');

            if (!isEnabled) {

                const sessionData = await this.createSession(
                    currentUser,
                    dto.ip_address,
                    dto.user_agent,
                    userRoles,
                    rolePermissions,
                    sessions,
                    refreshTokens
                );

                await auditLogs.save({
                    entity_type: EntityType.USER,
                    entity_id: currentUser.id,
                    action: LOGIN_USER,
                    user_id: currentUser.id,
                    old_values: {
                        email: dto.email,
                        password: "xxxxxxxxxxxxxxxxxx"
                    },
                    new_values: {

                    },
                    user_agent: dto.user_agent,
                    ip_address: dto.ip_address,
                });

                const log: ILogMetadata = {
                    service: env.service_name,
                    event: LOGIN_USER,
                    entity_id: currentUser.id,
                    method: 'POST',
                    route: 'api/v1/users/login',
                    created_at: new Date().toISOString(),
                    payload: {
                        user: sessionData.user,
                        roles: JSON.stringify(sessionData.roles),
                        permissions: JSON.stringify(sessionData.permissions)
                    }
                };

                this._logger.info('login user', log);
                return sessionData;

            }

            const { hasAny } = await dobleFactorAuth.hasAnyAuthCodeByPurposeAndUserIdAndStatus(currentUser.id, AuthCodePurpose.login_2fa, AuthCodeStatus.active);

            if (+hasAny) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'The current user has already auth code autenticator active');

            const { external_id, authcode, authcodeid } = await this.createAuthCode(currentUser.id, dobleFactorAuth);
            await auditLogs.save({
                entity_type: EntityType.AUTHCODE,
                entity_id: authcodeid,
                action: NEW_AUTH_CODE,
                user_id: currentUser.id,
                old_values: {
                },
                new_values: {
                    auth_code_external_id: external_id,
                    authcode,
                    status: AuthCodeStatus.active,
                    purpose: AuthCodePurpose.login_2fa,
                    channel: AuthCodeChannel.email,
                },
                user_agent: dto.user_agent,
                ip_address: dto.ip_address,
            })

            const response: AuthCodeDataResponse = {
                challeneg_id: external_id,
                requires_2fa: true,
                auth_code: authcode
            };

            return response;
        })
    }

    async validateCurrentRefreshToken(refreshToken: string, user_id?: number): Promise<boolean> {
        return await this.unitOfWork.execute(async ({ refreshTokens, users, sessions }) => {

            const currentRefreshToken = await refreshTokens.getCurrentRefreshToken(refreshToken);
            if (!currentRefreshToken) return false;
            else {

                const currentSession = await sessions.getCurrentSessionIdByUserId(currentRefreshToken.session_id);
                if (!currentSession) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'The current session is ended');
                // validar aqui si la session se vencio
                const currentUser = await users.findbyId(currentRefreshToken.user_id);

                if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'User not exists');
                if (currentUser.status === UserStatus.blocked) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User  account is blocked');
                if (currentUser.status === UserStatus.inactive) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is inactive');

                if (user_id && currentRefreshToken.user_id !== user_id) return false;
                return true;
            }
        })
    }

    async setRefreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
        return await this.unitOfWork.execute(async ({ refreshTokens, users, sessions }) => {

            const currentRefreshToken = await refreshTokens.getCurrentRefreshToken(refreshToken);
            if (!currentRefreshToken) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Invalid refresh token');

            await refreshTokens.revoke(refreshToken, RefreshTokenStatus.revoked);

            const currentUser = await users.findbyId(currentRefreshToken.user_id);
            const currentSession = await sessions.getCurrentSessionIdByUserId(currentRefreshToken.session_id);
            if (!currentSession) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'The current session is ended');


            const token_expires_at = Math.floor(Date.now() / 1000) + 15 * 60;
            const refresh_token = this.tokenManager.refreshToken();

            const [token, _] = await Promise.all([
                this.tokenManager.sign({
                    sid: currentSession.session_id,
                    uid: currentUser!.id,
                    sub: currentUser!.external_id
                }),
                refreshTokens.save({
                    user_id: currentUser!.id,
                    expires_at: new Date(currentSession.expires_at),
                    session_id: currentSession.session_id,
                    token_hash: refresh_token
                })
            ]);
            const response: IRefreshTokenResponse = {
                access_token: token,
                refresh_token,
                expires_at: token_expires_at,
            }
            return response;
        });
    }

    async logout(refreshToken: string, ip_address: string, user_agent: string) {
        return await this.unitOfWork.execute(async ({ refreshTokens, sessions, auditLogs }) => {

            const currentRefreshToken = await refreshTokens.getCurrentRefreshToken(refreshToken);
            if (!currentRefreshToken) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'Invalid refresh token');

            const currentSession = await sessions.getCurrentSessionIdByUserId(currentRefreshToken.session_id);
            if (!currentSession) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'The current session is ended');

            // revokar session y refresh token

            await Promise.all([
                refreshTokens.revoke(refreshToken, RefreshTokenStatus.revoked),
                sessions.revoke(currentSession.session_id),
                auditLogs.save({
                    entity_type: EntityType.USER,
                    entity_id: currentRefreshToken.user_id,
                    action: LOGOUT_USER,
                    user_id: currentRefreshToken.user_id,
                    old_values: {

                    },
                    new_values: {

                    },
                    ip_address,
                    user_agent
                })
            ]);

            const log: ILogMetadata = {
                service: env.service_name,
                event: LOGOUT_USER,
                method: 'POST',
                route: 'api/v1/users/logout',
                created_at: new Date().toISOString(),

            };

            this._logger.info('logout user', log);
        })

    }

    async setStatus(user_id: number, status: UserStatus, ip_address: string, user_agent: string) {
        return this.unitOfWork.execute(async ({ users, auditLogs }) => {


            const currentUser = await users.findbyId(user_id);

            if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'User not exists');
            if (currentUser.status === UserStatus.blocked) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User  account is blocked');
            if (currentUser.status === UserStatus.inactive) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is inactive');


            delete currentUser.password;

            const log: ILogMetadata = {
                service: env.service_name,
                event: CHANGE_USER_STATUS,
                method: 'POST',
                route: 'api/v1/status/:id',
                created_at: new Date().toISOString(),
                payload: {
                    prevStatus: currentUser.status!,
                    currentStatus: status,
                    ...currentUser
                }

            };

            this._logger.info('user status changed', log);

            await Promise.all([
                users.setStatus(user_id, status),
                auditLogs.save({
                    entity_type: EntityType.USER,
                    entity_id: currentUser.id,
                    action: CHANGE_USER_STATUS,
                    user_id,
                    old_values: {
                        prevStatus: currentUser.status?.toString()!
                    },
                    new_values: {
                        currentStatus: status,
                    },
                    ip_address,
                    user_agent
                })
            ])
        })
    }

    async verifyTwoFactorAuthenticate(
        challenge_id: string, auth_code: string, ip_address: string, user_agent: string
    ): Promise<VerifyTwoFactorAuthenticateResponse> {
        const dataResponse = await this.unitOfWork.execute(async ({ users, dobleFactorAuth, userRoles, rolePermissions, sessions, refreshTokens }) => {
            let response: VerifyTwoFactorAuthenticateResponse;

            const currentAuthCode = await dobleFactorAuth.getCodeAuthenticatorData(challenge_id, AuthCodePurpose.login_2fa);

            if (!currentAuthCode) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Invalid auth code');
            if (currentAuthCode.status !== AuthCodeStatus.active) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Auth code is not available');

            if (currentAuthCode.expired) {
                // marcar codigo como vencido y confirmar en bd
                await dobleFactorAuth.setStatusCodeAuthenticator(challenge_id, currentAuthCode.user_id, AuthCodeStatus.expired);
                response = { success: false, expired: true, maxAttempsFailed: false, attemptsLeft: 0 };
                return response;
            }

            const currentUser = await users.findbyId(currentAuthCode.user_id);
            if (!currentUser) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'User not exists');
            if (currentUser.status === UserStatus.blocked) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is blocked');
            if (currentUser.status === UserStatus.inactive) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'User account is inactive');

            const isValidCode = await this.secretHasher.verify(auth_code, currentAuthCode.authcode);

            if (!isValidCode) {
                // si en 3 intentos falla el codigo, revocarlo y bloquear el uso del 2fa
                await dobleFactorAuth.setAttemps(currentUser.id, challenge_id);
                const totalAttempts = (currentAuthCode.attempts ?? 0) + 1;

                if (totalAttempts >= 3) { // inhabilitar el 2fa y revocar el codigo actual
                    await Promise.all([
                        dobleFactorAuth.setStatusCodeAuthenticator(challenge_id, currentUser.id, AuthCodeStatus.revoked),
                        dobleFactorAuth.lockTwoFactorAuthenticator(LockAuthCodeReasons.maxFailureAttemps, currentUser.id)
                    ]);

                    return { success: false, expired: false, maxAttempsFailed: true, attemptsLeft: 0 };
                }

                response = {
                    success: false,
                    expired: false,
                    maxAttempsFailed: false,
                    attemptsLeft: 3 - totalAttempts
                };

                return response;
            }

            // codigo correcto: se pasa a usado
            await dobleFactorAuth.setStatusCodeAuthenticator(challenge_id, currentUser.id, AuthCodeStatus.used);



            // el codigo se pasa a usado, se guarda el log, se crea token con access token, sesion y devuelve respuesta
            const sessionData = await this.createSession(
                currentUser,
                ip_address,
                user_agent,
                userRoles,
                rolePermissions,
                sessions,
                refreshTokens
            );

            response = {
                success: true,
                expired: false,
                maxAttempsFailed: false,
                attemptsLeft: 0,
                loginData: sessionData
            };

            return response;
        });

        if (!dataResponse.success) {
            if (dataResponse.expired) {
                throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Auth code expired');
            }
            if (dataResponse.maxAttempsFailed) {
                throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Numero maximo de intentos fallidos. 2fa deshabilitado');
            }
            throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, `Intento fallido. Le quedan ${dataResponse.attemptsLeft} intentos posibles`);
        }

        return dataResponse;
    }
}