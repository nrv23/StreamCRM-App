
import { Database } from "../../../../config/query.js";
import { Customer } from "../../domain/entities/customer.entity.js";
import { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import { INow } from "../../interfaces/now.js";

export class PostgresCustomerRepository implements CustomerRepository {
  async save(customer: Customer): Promise<void> {
    // Aquí va el INSERT con pg.
    console.log("Saving customer in PostgreSQL", customer);
  }

  async findById(id: string): Promise<Customer | null> {
    // Aquí va el SELECT por id.
    console.log("Finding customer by id", id);
    return null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    // Aquí va el SELECT por email.
    console.log("Finding customer by email", email);
    return null;
  }

  async testQuery(params: any = []) {
    const result = await Database.query<INow>("SELECT NOW() AS now", params);
    return result[0] || null;
  }
}
