import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { UserController } from "../controllers/user.controller.ts";
import { UserService } from "../services/user.service.ts";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.ts";
import { fakeAuth } from "../shared/middleware/fake-user.middleware.ts";
import { createUserValidator } from "../validators/user/create-user.validator.ts";
import { PasswordHasher, Pbkdf2PasswordHasher } from "../shared/utils/passwordHash.ts";
import { getUsersValidator } from "../validators/user/get-users.validator.ts";


export class UserRoutes implements IRoutes {

    private readonly _unitOfWork: UnitOfWork;
    private readonly _userController: UserController;
    private readonly _userService: UserService;
    private readonly _passwordHasher: Pbkdf2PasswordHasher;
    private _router: Router;
    constructor(

    ) {
        this._passwordHasher = new Pbkdf2PasswordHasher();
        this._unitOfWork = new UnitOfWork();
        this._userService = new UserService(this._unitOfWork, this._passwordHasher);
        this._userController = new UserController(this._userService);
        this._router = Router()
    }

    BuildRoutes(): Router {

        this._router.post('/', fakeAuth, createUserValidator, validateRequest, this._userController.create.bind(this._userController));
        this._router.get('/me', fakeAuth, this._userController.me.bind(this._userController));
        this._router.post('/filtered', getUsersValidator, this._userController.getUsers.bind(this._userController));

        return this._router;
    }
}