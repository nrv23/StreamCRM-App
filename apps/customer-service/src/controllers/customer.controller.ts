import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from './../shared/types/api-response.js';

export class CustomerController {

    private _customerService: CustomerService;
    constructor(customerService: CustomerService) {
        this._customerService = customerService;
    }


    async createCustomer(req: Request, res: Response) {

        try {

            //const newCustomer = await this._customerService.save();

        } catch (error) {

        }
    }
}