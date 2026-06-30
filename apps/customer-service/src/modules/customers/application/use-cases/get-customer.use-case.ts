import { Customer } from "../../domain/entities/customer.entity";
import { CustomerNotFoundError } from "../../domain/errors/customer.errors";
import { CustomerRepository } from "../../domain/repositories/customer.repository";

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    return customer;
  }
}
