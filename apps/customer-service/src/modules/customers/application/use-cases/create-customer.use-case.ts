import crypto from "node:crypto";
import { Customer } from "../../domain/entities/customer.entity.js";
import { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import { CustomerAlreadyExistsError } from "../../domain/errors/customer.errors.js";
import { CreateCustomerDto } from "../dto/create-customer.dto.js";

export class CreateCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) { }

  async execute(dto: CreateCustomerDto): Promise<Customer> {
    if (dto.email) {
      const existingCustomer = await this.customerRepository.findByEmail(dto.email);

      if (existingCustomer) {
        throw new CustomerAlreadyExistsError(dto.email);
      }
    }

    const customer = Customer.create({
      id: crypto.randomUUID(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      country: dto.country ?? null,
    });

    await this.customerRepository.save(customer);

    return customer;
  }
}
