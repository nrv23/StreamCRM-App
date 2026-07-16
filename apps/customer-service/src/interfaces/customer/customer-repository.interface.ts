import { CreateCustomerDto } from "../../dto/customer/createCustomer.dto.js";
import { GetCustomerDto } from "../../dto/customer/getCustomer.dto.js";
import { UpdateCustomerDto } from "../../dto/customer/updateCustomer.dto.js";
import { Customer } from "../../entity/Customer.entity.js";
import { CustomerStatus } from "../../enum/CustomerStatus.type.js";

export interface ICustomerRepository {
    save(customer: CreateCustomerDto): Promise<Customer>;
    findById(id: number): Promise<Customer | null>;
    findByEmail(email: string): Promise<Customer | null>;
    update(customer: UpdateCustomerDto): Promise<Customer>;
    searchByFilters(options: GetCustomerDto): Promise<Customer[]>;
    getTotalRecords(options: GetCustomerDto): Promise<number>;
    delete(id: number, status: CustomerStatus): Promise<Customer>;
}