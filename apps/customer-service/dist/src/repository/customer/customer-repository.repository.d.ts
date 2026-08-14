import type { IDatabase } from "../../interfaces/database.interface.js";
import { CreateCustomerDto } from '../../dto/customer/createCustomer.dto.js';
import { GetCustomerDto } from '../../dto/customer/getCustomer.dto.js';
import { UpdateCustomerDto } from '../../dto/customer/updateCustomer.dto.js';
import { Customer } from '../../entity/Customer.entity.js';
import { CustomerStatus } from '../../enum/CustomerStatus.enum.js';
import { ICustomerRepository } from '../../interfaces/customer/customer-repository.interface.js';
export declare class CustomerRepository implements ICustomerRepository {
    private _db;
    constructor(db?: IDatabase);
    save(customer: CreateCustomerDto): Promise<Customer>;
    findById(id: number): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;
    update(customer: UpdateCustomerDto): Promise<Customer>;
    setStatus(id: number, status: CustomerStatus): Promise<Customer>;
    searchByFilters(options: GetCustomerDto): Promise<Customer[]>;
    getTotalRecords(options: GetCustomerDto): Promise<number>;
}
//# sourceMappingURL=customer-repository.repository.d.ts.map