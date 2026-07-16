import { databaseInstance } from "../../config/query.js";
import type { IDatabase } from "../../interfaces/database.interface.js";
import { CreateCustomerDto } from '../../dto/customer/createCustomer.dto.js';
import { GetCustomerDto } from '../../dto/customer/getCustomer.dto.js';
import { UpdateCustomerDto } from '../../dto/customer/updateCustomer.dto.js';
import { Customer } from '../../entity/Customer.entity.js';
import { CustomerStatus } from '../../enum/CustomerStatus.type.js';
import { ICustomerRepository } from '../../interfaces/customer/customer-repository.interface.js';

// aqui se implementa la parte de postgresql


export class CustomerRepository implements ICustomerRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(customer: CreateCustomerDto): Promise<Customer> {

        const newCustomer = await this._db.query<Customer>(`
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

        const customer = await this._db.query(
            'select  id, first_name, last_name, email, phone, country, status from customers where id = $1', [id]
        );

        if (customer.length === 0) return null;
        return customer[0] as Customer;
    }

    async findByEmail(email: string): Promise<Customer | null> {

        const customer = await this._db.query(
            'select  id, first_name, last_name, email, phone, country, status from customers where email = $1', [email]
        );

        if (customer.length === 0) return null;
        return customer[0] as Customer;
    }

    async update(customer: UpdateCustomerDto): Promise<Customer> {
        const { firstName, lastName, email, phone, id } = customer;

        const query = `
            update customers set first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = now() where id = $5 
            RETURNING id, first_name, last_name, email, phone, country, status;
        ` ;
        const response = await this._db.query<Customer>(query, [firstName, lastName, email, phone, id]);
        return response[0] as Customer;
    }

    // delete soft
    async setStatus(
        id: number,
        status: CustomerStatus,
    ): Promise<Customer> {
        const query = `
            UPDATE customers
            SET
                status = $1::varchar,
                updated_at = now(),
                deleted_at = CASE
                    WHEN $1::varchar = 'blocked'::varchar THEN now() -- convertir el valor a varchar
                    ELSE NULL
                END
            WHERE id = $2
            RETURNING
                id,
                first_name,
                last_name,
                email,
                phone,
                country,
                status;
        `;

        const response = await this._db.query<Customer>(
            query,
            [status, id],
        );

        return response[0] as Customer;
    }


    async searchByFilters(options: GetCustomerDto): Promise<Customer[]> {
        const page = options.page!;
        const limit = options.limit!;
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

        const customers = await this._db.query<Customer>(query, params);
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

        const response = await this._db.query<{
            totalRecords: number
        }>(query, params);

        return Number(response[0]?.totalRecords || 0);
    }
}