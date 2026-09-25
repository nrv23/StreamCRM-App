import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { UserController } from "../controllers/user.controller.ts";
import { UserService } from "../services/user.service.ts";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.ts";
import { createUserValidator } from "../validators/user/create-user.validator.ts";
import { Pbkdf2PasswordHasher } from "../shared/utils/passwordHash.ts";
import { getUsersValidator } from "../validators/user/get-users.validator.ts";
import { loginValidator } from "../validators/user/login.dto.ts";
import { TokenManager } from "../shared/utils/tokenManager.ts";
import { refreshTokenValidator } from "../validators/auth/refresh-token.validator.ts";
import { refreshTokenMiddleware } from "../shared/middleware/refresh-token.middleware.ts";
import { logoutValidator } from "../validators/auth/logout.validator.ts";
import { validateToken } from "../shared/middleware/validate-token.middleware.ts";
import { SetStatusUserValidator } from "../validators/user/set-status.validator.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";
import { env } from "../config/enviroment.ts";
import { requirePermission } from "../shared/middleware/validate-role-manage-user.middleware.ts";
import { InterfaceValidatorData } from "../shared/utils/interface-validator.ts";
import { ISecretHasher } from "../interfaces/user/auhtcode-hash.interface.ts";
import { HmacSecretHasher } from "../shared/utils/authCodeHash.ts";


export class UserRoutes implements IRoutes {

    private readonly _unitOfWork: UnitOfWork;
    private readonly _userController: UserController;
    private readonly _userService: UserService;
    private readonly _passwordHasher: Pbkdf2PasswordHasher;
    private readonly _tokenManager: TokenManager;
    private readonly _secretHasher: ISecretHasher;
    private _router: Router;
    constructor(

    ) {
        this._passwordHasher = new Pbkdf2PasswordHasher();
        this._unitOfWork = new UnitOfWork();
        this._tokenManager = new TokenManager();
        this._secretHasher = new HmacSecretHasher(env.two_factor_hmac_secret)
        this._userService = new UserService(
            this._unitOfWork,
            this._passwordHasher,
            this._tokenManager,
            this._secretHasher,
            WinstonLogger.getInstance(
                env.elastic_search_url,
                'auth-module',
                'debug',
                env.index_elastic_search_name
            ));
        this._userController = new UserController(this._userService, new InterfaceValidatorData());
        this._router = Router()
    }

    BuildRoutes(): Router {

        this._router.post('/', validateToken, createUserValidator, validateRequest, requirePermission('users.create'), this._userController.create.bind(this._userController));
        this._router.get('/me', validateToken, this._userController.me.bind(this._userController));
        this._router.post('/filtered', validateToken, getUsersValidator, validateRequest, this._userController.getUsers.bind(this._userController));
        this._router.post('/login', loginValidator, validateRequest, this._userController.login.bind(this._userController));
        this._router.post('/refresh_token', refreshTokenValidator, validateRequest, refreshTokenMiddleware, this._userController.setRefreshToken.bind(this._userController));
        this._router.post('/logout', logoutValidator, validateRequest, this._userController.logout.bind(this._userController));
        this._router.patch('/status/:id', validateToken, SetStatusUserValidator, validateRequest, this._userController.setStatus.bind(this._userController));

        return this._router;
    }
}