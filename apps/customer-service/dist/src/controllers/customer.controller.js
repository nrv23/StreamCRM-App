import { randomUUID } from 'node:crypto';
import { CustomerStatus } from '../enum/CustomerStatus.enum.js';
export class CustomerController {
    _customerService;
    constructor(customerService) {
        this._customerService = customerService;
    }
    async createCustomer(req, res) {
        const body = req.body;
        const { id } = req.user;
        const { ip_address, user_agent } = req.requestDataInfo;
        const newCustomer = {
            ...body,
            external_id: randomUUID(),
            user_id: id,
            ip_address,
            user_agent
        };
        const customerCreatedResponse = await this._customerService.save(newCustomer);
        const response = {
            response: {
                message: "Customer created",
                details: customerCreatedResponse
            },
            success: true
        };
        res.status(201).json(response);
        return;
    }
    async search(req, res) {
        const query = req.query;
        const data = await this._customerService.search(query);
        const response = {
            response: {
                message: "",
                details: data
            },
            success: true,
        };
        res.status(200).json(response);
        return;
    }
    async update(req, res) {
        const { ip_address, user_agent } = req.requestDataInfo;
        const { id } = req.params;
        const { id: user_id } = req.user;
        const body = req.body;
        const customer = {
            id: +id,
            ...body,
            user_id,
            ip_address,
            user_agent
        };
        const updateCustomerResponse = await this._customerService.update(customer);
        const response = {
            response: {
                message: "Customer updated",
                details: updateCustomerResponse
            },
            success: true
        };
        res.status(200).json(response);
        return;
    }
    async setStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const { id: user_id } = req.user;
        const { ip_address, user_agent } = req.requestDataInfo;
        const newCustomerStatusResponse = await this._customerService.setStatus(+id, status, user_id, ip_address, user_agent);
        const response = {
            response: {
                message: status === CustomerStatus.blocked
                    ? "Customer deleted"
                    : "Customer status was changed",
                details: newCustomerStatusResponse
            },
            success: true
        };
        res.status(200).json(response);
        return;
    }
    async seachById(req, res) {
        const { id } = req.params;
        const customer = await this._customerService.searchById(+id);
        const response = {
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
//# sourceMappingURL=customer.controller.js.map