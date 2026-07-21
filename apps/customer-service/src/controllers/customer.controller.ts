import { Customer } from '../entity/Customer.entity.js';
import { CustomerService } from '../services/customer.service.js';
import { ApiResponse } from './../shared/types/api-response.js';
import { CreateCustomerDto } from '../dto/customer/createCustomer.dto.js';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { GetCustomerDto } from '../dto/customer/getCustomer.dto.js';
import { IPaginationResponse } from '../interfaces/pagination.interface.js';
import { UpdateCustomerDto } from '../dto/customer/updateCustomer.dto.js';
import { CustomerStatus } from '../enum/CustomerStatus.enum.js';

export class CustomerController {

    private _customerService: CustomerService;
    constructor(customerService: CustomerService) {
        this._customerService = customerService;
    }


    async createCustomer(req: Request, res: Response) {

        const body = req.body as any;
        const { id } = req.user;
        const { ip_address, user_agent } = req.requestDataInfo;
        const newCustomer = {
            ...body,
            external_id: randomUUID(),
            user_id: id,
            ip_address,
            user_agent
        }

        const customerCreatedResponse = await this._customerService.save(newCustomer as CreateCustomerDto);
        const response: ApiResponse<Customer> = {
            response: {
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
            response: {
                message: "",
                details: data
            },
            success: true,
        }
        res.status(200).json(response);
        return;
    }

    async update(req: Request, res: Response) {

        const { ip_address, user_agent } = req.requestDataInfo;
        const { id } = req.params;
        const { id: user_id } = req.user;
        const body = req.body as any;
        const customer = {
            id: +id!,
            ...body,
            user_id,
            ip_address,
            user_agent
        }



        const updateCustomerResponse = await this._customerService.update(customer as UpdateCustomerDto);
        const response: ApiResponse<Customer> = {
            response: {
                message: "Customer updated",
                details: updateCustomerResponse
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }

    async setStatus(req: Request, res: Response) {

        const { id } = req.params;
        const { status } = req.body;
        const { id: user_id } = req.user;
        const { ip_address, user_agent } = req.requestDataInfo;

        const newCustomerStatusResponse = await this._customerService.setStatus(+id!, status, user_id, ip_address, user_agent);
        const response: ApiResponse<Customer> = {
            response: {
                message: (status as CustomerStatus) === CustomerStatus.blocked
                    ? "Customer deleted"
                    : "Customer status was changed",
                details: newCustomerStatusResponse
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
            response: {
                message: "",
                details: customer
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }
}