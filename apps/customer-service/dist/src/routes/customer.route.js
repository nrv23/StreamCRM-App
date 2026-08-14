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
import { fakeAuth } from "../shared/middleware/fake-user.middleware.js";
import { env } from "../config/enviroment.js";
import { WinstonLogger } from "../shared/utils/winstonLogger.js";
export class CustomerRoutes {
    _router;
    _controller;
    _customerService;
    _customerRepository;
    _unitOfWork;
    constructor() {
        this._customerRepository = new CustomerRepository();
        this._unitOfWork = new UnitOfWork();
        this._customerService = new CustomerService(this._customerRepository, this._unitOfWork, WinstonLogger.getInstance(env.elastic_search_url, 'customer-module', 'debug', env.index_elastic_search_name));
        this._router = Router();
        this._controller = new CustomerController(this._customerService);
    }
    BuildRoutes() {
        this._router.post("/", createCustomerValidator, validateRequest, fakeAuth, this._controller.createCustomer.bind(this._controller));
        this._router.get("/", getCustomerValidator, validateRequest, this._controller.search.bind(this._controller));
        this._router.get("/:id", getCustomerValidator, validateRequest, this._controller.seachById.bind(this._controller));
        this._router.put("/:id", updateCustomerValidator, validateRequest, fakeAuth, this._controller.update.bind(this._controller));
        this._router.patch("/status/:id", deleteCustomerValidator, validateRequest, fakeAuth, this._controller.setStatus.bind(this._controller));
        return this._router;
    }
}
//# sourceMappingURL=customer.route.js.map