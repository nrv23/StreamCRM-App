import { Database } from '../config/query.js';
import { CreateCustomerDto } from '../dto/createCustomer.dto.js';
import { GetCustomerDto } from '../dto/getCustomer.dto.js';
import { UpdateCustomerDto } from '../dto/updateCustomer.dto.js';
import { Customer } from '../entity/customer.entity.js';
import { IPaginationResponse } from '../interfaces/pagination.interface.js';
import { ICustomerRepository } from './../interfaces/customer-repository.interface.js';

// aqui se implementa la parte de postgresql
export class CustomerRepository implements ICustomerRepository {

    constructor(private db: Database) { }
    async save(customer: CreateCustomerDto): Promise<Customer> {

        const newCustomer = await this.db.query<Customer>(`
            Insert into customer(
                external_id, first_name, last_name, email, phone, country, created_by_user_id
            ) 
            values($1,$2,$3,$4,$5,$6,$7) RETURNING id, first_name, last_name, email, phone, country, status;
            `,
            [
                customer.external_id, customer.firstName, customer.lastName, customer.email, customer.phone,
                customer.country, customer.createByUser
            ]
        );
        return newCustomer[0] as Customer;
    }
    findById(id: string): Promise<Customer | null> {
        throw new Error('Method not implemented.');
    }
    findByEmail(email: string): Promise<Customer | null> {
        throw new Error('Method not implemented.');
    }
    update(customer: UpdateCustomerDto): Promise<Customer> {
        throw new Error('Method not implemented.');
    }
    search(options: GetCustomerDto): Promise<IPaginationResponse<Customer>> {
        throw new Error('Method not implemented.');
    }
}