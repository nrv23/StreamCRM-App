import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { MetricsController } from "../controllers/metrics.controller.ts";
import MetricsService from "../services/metrics.service.ts";



export class MetricsRoutes implements IRoutes {


    private _router: Router;
    private _metricsService: MetricsService;
    private _metricsController: MetricsController;
    constructor() {
        this._metricsService = new MetricsService();
        this._metricsController = new MetricsController(this._metricsService);
        this._router = Router();
    }

    BuildRoutes(): Router {
        this._router.get("/metrics", this._metricsController.metrics.bind(this._metricsController));
        return this._router;
    }
}