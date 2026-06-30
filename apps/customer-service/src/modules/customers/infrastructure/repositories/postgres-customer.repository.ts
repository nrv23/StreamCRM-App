import { Customer } from "../../domain/entities/customer.entity";
import { CustomerRepository } from "../../domain/repositories/customer.repository";

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
}
