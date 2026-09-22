import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { validateToken } from "../shared/middleware/validate-token.middleware.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";
import { env } from "../config/enviroment.ts";
import { PermissionsService } from "../services/permissions.service.ts";
import { PermissionsController } from "../controllers/permissions.controller.ts";
import { SetNewPermissionsValidator } from "../validators/permission/set-new-permissions.validator.ts";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.ts";
import { requirePermission } from "../shared/middleware/validate-role-manage-user.middleware.ts";


export class PermissionsRoutes implements IRoutes {

    private readonly _unitOfWork: UnitOfWork;
    private readonly _permissionsService: PermissionsService;
    private readonly _permissionsController: PermissionsController
    private _router: Router;
    constructor(

    ) {

        this._unitOfWork = new UnitOfWork();
        this._permissionsService = new PermissionsService(this._unitOfWork, WinstonLogger.getInstance(
            env.elastic_search_url,
            'auth-module',
            'debug',
            env.index_elastic_search_name
        ));
        this._permissionsController = new PermissionsController(this._permissionsService)
        this._router = Router()
    }

    BuildRoutes(): Router {

        this._router.get('/', validateToken, this._permissionsController.getAllPermissions.bind(this._permissionsController));
        this._router.patch('/:userid', validateToken, SetNewPermissionsValidator, validateRequest, requirePermission("roles.manage"), this._permissionsController.setNewPermissions.bind(this._permissionsController));

        return this._router;
    }
}