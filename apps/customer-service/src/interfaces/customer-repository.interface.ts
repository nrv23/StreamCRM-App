import { CreateCustomerDto } from "../dto/createCustomer.dto.js";
import { GetCustomerDto } from "../dto/getCustomer.dto.js";
import { UpdateCustomerDto } from "../dto/updateCustomer.dto.js";
import { Customer } from "../entity/customer.entity.js";
import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export interface ICustomerRepository {
    save(customer: CreateCustomerDto): Promise<Customer>;
    findById(id: number): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;
    update(customer: UpdateCustomerDto): Promise<Customer>;
    updateByFilters(customer: UpdateCustomerDto): Promise<Customer>;
    searchByFilters(options: GetCustomerDto): Promise<Customer[]>;
    getTotalRecords(options: GetCustomerDto): Promise<number>;
    delete(id: number, status: CustomerStatus): Promise<Customer>;
    deleteByFilters(id: number, status: CustomerStatus): Promise<Customer>;
}