import { Router } from "express";
import { createCustomerValidator } from "../validators/customer/create-customer.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { CustomerService } from "../services/customer.service.js";
import { CustomerRepository } from "../repository/customer/customer-repository.repository.js";
import { getCustomerValidator } from "../validators/customer/get-customer.validator.js";
import { updateCustomerValidator } from "../validators/customer/update-customer.validator.js";
import { deleteCustomerValidator } from "../validators/customer/delete-customer.validator.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { IRoutes } from "../interfaces/routes.interface.js";
import { fakeAuth } from "../shared/middleware/fake-user.middleware.js";

import { env } from "../config/enviroment.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";

export class CustomerRoutes implements IRoutes {

    private _router: Router;
    private _controller: CustomerController;
    private _customerService: CustomerService;
    private _customerRepository: CustomerRepository;
    private _unitOfWork: UnitOfWork;

    constructor() {

        this._customerRepository = new CustomerRepository();
        this._unitOfWork = new UnitOfWork();
        this._customerService = new CustomerService(
            this._customerRepository,
            this._unitOfWork,
            WinstonLogger.getInstance(
                env.elastic_search_url,
                'customer-module',
                'debug',
                env.index_elastic_search_name
            )
        );
        this._router = Router();
        this._controller = new CustomerController(this._customerService)
    }

    BuildRoutes(): Router {
        this._router.post("/", createCustomerValidator, validateRequest, fakeAuth, this._controller.createCustomer.bind(this._controller));
        this._router.get("/", getCustomerValidator, validateRequest, this._controller.search.bind(this._controller));
        this._router.get("/:id", getCustomerValidator, validateRequest, this._controller.seachById.bind(this._controller));
        this._router.put("/:id", updateCustomerValidator, validateRequest, fakeAuth, this._controller.update.bind(this._controller));
        this._router.patch("/status/:id", deleteCustomerValidator, validateRequest, fakeAuth, this._controller.setStatus.bind(this._controller));

        return this._router;
    }
}