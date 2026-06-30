import { INow } from "../../interfaces/now.js";
import { Customer } from "../entities/customer.entity.js";

export interface CustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  testQuery(params: any): Promise<INow | null>;
}
