import { Database } from '../config/query.js';
import { CreateCustomerDto } from '../dto/createCustomer.dto.js';
import { GetCustomerDto } from '../dto/getCustomer.dto.js';
import { UpdateCustomerDto } from '../dto/updateCustomer.dto.js';
import { Customer } from '../entity/customer.entity.js';
import { ICustomerRepository } from './../interfaces/customer-repository.interface.js';

// aqui se implementa la parte de postgresql


export class CustomerRepository implements ICustomerRepository {

    constructor(private db: Database) { }
    async save(customer: CreateCustomerDto): Promise<Customer> {

        const newCustomer = await this.db.query<Customer>(`
            Insert into customers(
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
    async findById(id: number): Promise<Customer | null> {

        const customer = await this.db.query(
            'select  id, first_name, last_name, email, phone, country, status from customers where id = $1', [id]
        );

        if (customer.length === 0) return null;
        return customer[0] as Customer;
    }

    async findByEmail(email: string): Promise<Customer | null> {

        const customer = await this.db.query(
            'select  id, first_name, last_name, email, phone, country, status from customers where email = $1', [email]
        );

        if (customer.length === 0) return null;
        return customer[0] as Customer;
    }

    update(customer: UpdateCustomerDto): Promise<Customer> {
        throw new Error('Method not implemented.');
    }

    async searchByFilters(options: GetCustomerDto): Promise<Customer[]> {
        const page = options.page || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const params: any[] = [];
        let query = `
            select id, first_name, last_name, email, phone, country, status 
            from customers 
            where deleted_at is null
        `;

        if (options.search) {
            params.push(`%${options.search}%`);
            query += ` and concat(first_name, ' ', last_name) ilike $${params.length}`;
        }
        if (options.status) {
            params.push(options.status);
            query += ` and status = $${params.length}`;
        }
        if (options.country) {
            params.push(options.country);
            query += ` and country = $${params.length}`;
        }

        const sortColumn = (options.sortBy && options.sortBy === 'name' ? "concat(first_name, ' ', last_name)" : options.sortBy) || 'id';
        const sortOrder = options.orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` order by ${sortColumn} ${sortOrder} limit ${limit} offset ${offset};`;

        const customers = await this.db.query<Customer>(query, params);
        return customers;
    }
    // count de registros



    async getTotalRecords(options: GetCustomerDto): Promise<number> {
        const params: any[] = [];
        let query = `
            select count(1) as "totalRecords"
            from customers 
            where deleted_at is null
        `;

        if (options.search) {
            params.push(`%${options.search}%`);
            query += ` and concat(first_name, ' ', last_name) ilike $${params.length}`;
        }
        if (options.status) {
            params.push(options.status);
            query += ` and status = $${params.length}`;
        }
        if (options.country) {
            params.push(options.country);
            query += ` and country = $${params.length}`;
        }

        const response = await this.db.query<{
            totalRecords: number
        }>(query, params);

        return Number(response[0]?.totalRecords || 0);
    }
}