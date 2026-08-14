import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.js";
export declare class CustomerRoutes implements IRoutes {
    private _router;
    private _controller;
    private _customerService;
    private _customerRepository;
    private _unitOfWork;
    constructor();
    BuildRoutes(): Router;
}
//# sourceMappingURL=customer.route.d.ts.map