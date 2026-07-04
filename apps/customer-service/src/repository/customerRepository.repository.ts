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

        // Array para almacenar los valores de los filtros dinámicos
        const queryParams: any[] = [];

        // Base de la consulta
        let query = `
            select id, first_name, last_name, email, phone, country, status 
            from customers 
            where deleted_at is null

            ${options.search ? ` and concat(first_name, '', last_name) ilike '%${options.search}%'` : ''}
            ${options.status ? ` and status = '${options.status}'` : ''}
            ${options.country ? `and country = '${options.country}'` : ''}
        `;

        // Validamos que el sortBy exista en nuestra lista, si no, ordenamos por id por defecto
        const sortColumn = (options.sortBy && options.sortBy === 'name' ? 'concat(first_name, " ", last_name)' : options.sortBy) || 'id';

        // Validamos que el orderBy sea estrictamente ASC o DESC para evitar inyecciones ahí
        const sortOrder = options.orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        query += ` order by ${sortColumn} ${sortOrder}`;

        // 3. Paginación (Añadimos LIMIT y OFFSET con parámetros)
        queryParams.push(limit, offset);
        query += ` limit ${limit} offset ${offset};`;

        // Ejecutar la query pasando la estructura y sus parámetros correspondientes
        const customers = await this.db.query<Customer>(query);
        return customers;
    }
    // count de registros



    async getTotalRecords(options: GetCustomerDto): Promise<number> {

        /*
            GET /customers?page=1&pageSize=20
            GET /customers?status=active
            GET /customers?country=CR
            GET /customers?search=Juan
            GET /customers?sort=created_at&order=desc
        */
        const query = `
            select  
                count(1) as totalRecords
            from customers 
            where deleted_at is null

            ${options.search ? ` and concat(first_name, ' ', last_name) =  ${options.search}` : ''}
            ${options.status ? `and status = ${options.status}` : ''}
            ${options.country ? `and country = ${options.country}` : ''}
        `;

        const response = await this.db.query<{
            totalRecords: number
        }>(query);

        return response[0]?.totalRecords!;
    }
}