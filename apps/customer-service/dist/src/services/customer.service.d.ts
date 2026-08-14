import { UnitOfWork } from "../config/unitOfWork.js";
import { GetCustomerDto } from "../dto/customer/getCustomer.dto.js";
import { UpdateCustomerDto } from "../dto/customer/updateCustomer.dto.js";
import { Customer } from "../entity/Customer.entity.js";
import { CustomerStatus } from "../enum/CustomerStatus.enum.js";
import { ICustomerRepository } from "../interfaces/customer/customer-repository.interface.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { CreateCustomerDto } from '../dto/customer/createCustomer.dto.js';
import { Logger } from "winston";
export declare class CustomerService {
    private _unitOfWork;
    private _customerRepository;
    private _logger;
    constructor(customerRepository: ICustomerRepository, unitOfWork: UnitOfWork, logger: Logger);
    save(dto: CreateCustomerDto): Promise<Customer>;
    search(options: GetCustomerDto): Promise<IPaginationResponse<Customer[]>>;
    update(dto: UpdateCustomerDto): Promise<Customer>;
    setStatus(customer_id: number, status: CustomerStatus, user_id: number, ip_address: string, user_agent: string): Promise<Customer>;
    searchById(id: number): Promise<Customer>;
}
//# sourceMappingURL=customer.service.d.ts.map