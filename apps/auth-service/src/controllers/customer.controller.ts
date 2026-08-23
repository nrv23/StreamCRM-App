import { CustomerService } from '../services/customer.service.js';



export class CustomerController {

    private _customerService: CustomerService;
    constructor(customerService: CustomerService) {
        this._customerService = customerService;
    }



}