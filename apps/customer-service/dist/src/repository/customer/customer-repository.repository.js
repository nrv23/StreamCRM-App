import { databaseInstance } from "../../config/query.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";
// aqui se implementa la parte de postgresql
export class CustomerRepository {
    _db;
    constructor(db) {
        this._db = db ?? databaseInstance;
    }
    async save(customer) {
        const [newCustomer] = await this._db.query(`
            Insert into customers(
                external_id, first_name, last_name, email, phone, country, created_by_user_id
            ) 
            values($1,$2,$3,$4,$5,$6,$7) RETURNING id, first_name, last_name, email, phone, country, status;
            `, [
            customer.external_id, customer.firstName, customer.lastName, customer.email, customer.phone,
            customer.country, customer.createByUser
        ]);
        if (!newCustomer)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "Customer was not inserted");
        return newCustomer;
    }
    async findById(id) {
        const customer = await this._db.query('select  id, first_name, last_name, email, phone, country, status from customers where id = $1', [id]);
        if (customer.length === 0)
            return null;
        return customer[0];
    }
    async findByEmail(email) {
        const customer = await this._db.query('select  id, first_name, last_name, email, phone, country, status from customers where email = $1', [email]);
        if (customer.length === 0)
            return null;
        return customer[0];
    }
    async update(customer) {
        const { firstName, lastName, email, phone, id } = customer;
        const query = `
            update customers set first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = now() where id = $5 
            RETURNING id, first_name, last_name, email, phone, country, status;
        `;
        const [response] = await this._db.query(query, [firstName, lastName, email, phone, id]);
        if (!response)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "Customer was not updated");
        return response;
    }
    // delete soft
    async setStatus(id, status) {
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
        const [response] = await this._db.query(query, [status, id]);
        if (!response)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "Customer was not updated");
        return response;
    }
    async searchByFilters(options) {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `
    SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        country,
        status
    FROM customers
    WHERE deleted_at IS NULL
    `;
        if (options.search) {
            params.push(`%${options.search}%`);
            query += `
        AND CONCAT(first_name, ' ', last_name) ILIKE $${params.length}
        `;
        }
        if (options.status) {
            params.push(options.status);
            query += `
        AND status = $${params.length}
        `;
        }
        if (options.country) {
            params.push(options.country);
            query += `
        AND country = $${params.length}
        `;
        }
        // Lista blanca segura: la expresión SQL ya viene validada
        const sortExpressions = {
            id: "id",
            name: "CONCAT(first_name, ' ', last_name)",
            email: "email",
            country: "country",
            status: "status",
            createdAt: "created_at",
        };
        const requestedSort = options.sortBy ?? "id";
        const sortExpression = sortExpressions[requestedSort] ?? sortExpressions.id;
        const sortOrder = options.orderBy?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        // Agregamos SOLO limit y offset a params
        params.push(limit);
        const limitIndex = params.length;
        params.push(offset);
        const offsetIndex = params.length;
        // Concatenamos sortExpression y sortOrder de la lista blanca directamente
        query += `
    ORDER BY ${sortExpression} ${sortOrder}
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;
        const customers = await this._db.query(query, params);
        return customers;
    }
    // count de registros
    async getTotalRecords(options) {
        const params = [];
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
        const response = await this._db.query(query, params);
        return Number(response[0]?.totalRecords || 0);
    }
}
//# sourceMappingURL=customer-repository.repository.js.map