import { Customer } from '../entity/customer.entity.js';
import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from './../shared/types/api-response.js';
import { CreateCustomerDto } from './../dto/createCustomer.dto.js';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export class CustomerController {

    private _customerService: CustomerService;
    constructor(customerService: CustomerService) {
        this._customerService = customerService;
    }


    async createCustomer(req: Request, res: Response) {

        const body = req.body as any;
        const newCustomer = {
            ...body,
            external_id: randomUUID()
        }
        const customerCreatedResponse = await this._customerService.save(newCustomer as CreateCustomerDto);
        const response: ApiResponse<Customer> = {
            data: customerCreatedResponse,
            success: true
        }

        res.status(201).json(response);
        return;
    }
}