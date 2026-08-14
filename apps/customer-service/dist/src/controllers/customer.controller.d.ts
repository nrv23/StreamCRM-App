import { CustomerService } from '../services/customer.service.js';
import { Request, Response } from 'express';
export declare class CustomerController {
    private _customerService;
    constructor(customerService: CustomerService);
    createCustomer(req: Request, res: Response): Promise<void>;
    search(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    setStatus(req: Request, res: Response): Promise<void>;
    seachById(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=customer.controller.d.ts.map