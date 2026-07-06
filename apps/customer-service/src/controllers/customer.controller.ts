import { Customer } from '../entity/customer.entity.js';
import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from './../shared/types/api-response.js';
import { CreateCustomerDto } from './../dto/createCustomer.dto.js';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { GetCustomerDto } from '../dto/getCustomer.dto.js';
import { IPaginationResponse } from '../interfaces/pagination.interface.js';
import { UpdateCustomerDto } from '../dto/updateCustomer.dto.js';

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
            data: {
                message: "Customer created",
                details: customerCreatedResponse
            },
            success: true
        }

        res.status(201).json(response);
        return;
    }

    async search(req: Request, res: Response) {

        const query = req.query as any;
        const data = await this._customerService.search(query as GetCustomerDto);
        const response: ApiResponse<IPaginationResponse<Customer[]>> = {
            data: {
                message: "",
                details: data
            },
            success: true,
        }
        res.status(200).json(response);
        return;
    }

    async update(req: Request, res: Response) {

        const { id } = req.params;
        const body = req.body as any;
        const customer = {
            id: +id!,
            ...body
        }

        const updateCustomerResponse = await this._customerService.update(customer as UpdateCustomerDto);
        const response: ApiResponse<Customer> = {
            data: {
                message: "Customer updated",
                details: updateCustomerResponse
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }

    async delete(req: Request, res: Response) {

        const { id } = req.params;
        const { status } = req.body as any;

        const deletedCustomerResponse = await this._customerService.delete(+id!, status);
        const response: ApiResponse<Customer> = {
            data: {
                message: "Customer deleted",
                details: deletedCustomerResponse
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }

    async seachById(req: Request, res: Response) {
        const { id } = req.params;
        const customer = await this._customerService.searchById(+id!);
        const response: ApiResponse<Customer> = {
            data: {
                message: "",
                details: customer
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }
}