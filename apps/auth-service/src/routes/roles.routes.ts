import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.ts";
import { UnitOfWork } from "../config/unitOfWork.ts";
import { validateToken } from "../shared/middleware/validate-token.middleware.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";
import { env } from "../config/enviroment.ts";
import { RolesService } from "../services/roles.service.ts";
import { RolesController } from "../controllers/roles.controller.ts";


export class RolesRoutes implements IRoutes {

    private readonly _unitOfWork: UnitOfWork;
    private readonly rolesService: RolesService;
    private readonly _rolesController: RolesController
    private _router: Router;
    constructor(

    ) {

        this._unitOfWork = new UnitOfWork();
        this.rolesService = new RolesService(this._unitOfWork, WinstonLogger.getInstance(
            env.elastic_search_url,
            'auth-module',
            'debug',
            env.index_elastic_search_name
        ));
        this._rolesController = new RolesController(this.rolesService)
        this._router = Router()
    }

    BuildRoutes(): Router {

        this._router.get('/', validateToken, this._rolesController.getAllRoles.bind(this._rolesController));
        return this._router;
    }
}