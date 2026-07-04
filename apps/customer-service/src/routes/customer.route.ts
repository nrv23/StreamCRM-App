import { Router } from "express";
import { createCustomerValidator } from "../validators/create-customer.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { CustomerService } from "../services/customer.service.js";
import { CustomerRepository } from "../repository/customerRepository.repository.js";
import { Database } from "../config/query.js";



export class CustomerRoutes {

    private _router: Router;
    private _controller: CustomerController;
    private _customerService: CustomerService;
    private _customerRepository: CustomerRepository;
    private _database: Database;

    constructor() {
        this._database = new Database();
        this._customerRepository = new CustomerRepository(this._database);
        this._customerService = new CustomerService(this._customerRepository);
        this._router = Router();
        this._controller = new CustomerController(this._customerService)
    }

    BuildCustomerRoutes(): Router {
        this._router.post("/create", createCustomerValidator, validateRequest);
        return this._router;
    }
}