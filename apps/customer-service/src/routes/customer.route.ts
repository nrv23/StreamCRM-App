import { Router } from "express";
import { createCustomerValidator } from "../validators/create-customer.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { CustomerService } from "../services/customer.service.js";
import { CustomerRepository } from "../repository/customerRepository.repository.js";
import { getCustomerValidator } from "../validators/get-customer.validator.js";
import { updateCustomerValidator } from "../validators/update-customer.validator.js";
import { deleteCustomerValidator } from "../validators/delete-customer.validator.js";
import { UnitOfWork } from "../config/unitOfWork.js";

export class CustomerRoutes {

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
            this._unitOfWork
        );
        this._router = Router();
        this._controller = new CustomerController(this._customerService)
    }

    BuildCustomerRoutes(): Router {
        this._router.post("/", createCustomerValidator, validateRequest, this._controller.createCustomer.bind(this._controller));
        this._router.get("/", getCustomerValidator, validateRequest, this._controller.search.bind(this._controller));
        this._router.get("/:id", getCustomerValidator, validateRequest, this._controller.seachById.bind(this._controller));
        this._router.put("/:id", updateCustomerValidator, validateRequest, this._controller.update.bind(this._controller));
        this._router.delete("/:id", deleteCustomerValidator, validateRequest, this._controller.delete.bind(this._controller));

        return this._router;
    }
}