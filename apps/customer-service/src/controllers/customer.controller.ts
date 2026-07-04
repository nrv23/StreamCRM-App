import { Customer } from '../entity/customer.entity.js';
import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from './../shared/types/api-response.js';
import { CreateCustomerDto } from './../dto/createCustomer.dto.js';


export class CustomerController {

    private _customerService: CustomerService;
    constructor(customerService: CustomerService) {
        this._customerService = customerService;
    }


    async createCustomer(req: Request, res: Response) {

        try {
            // 
            const customerBody = req.body as CreateCustomerDto;

            const newCustomer = await this._customerService.save(customerBody);
            const response: ApiResponse<Customer> = {
                data: newCustomer,
                success: true
            }

            res.status(201).json(response);
            return;

        } catch (error) {

        }
    }
}