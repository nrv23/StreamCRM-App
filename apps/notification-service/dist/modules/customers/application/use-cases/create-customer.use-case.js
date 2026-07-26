import crypto from "node:crypto";
import { Customer } from "../../domain/entities/customer.entity";
import { CustomerAlreadyExistsError } from "../../domain/errors/customer.errors";
export class CreateCustomerUseCase {
    customerRepository;
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async execute(dto) {
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
            email: dto.email,
            phone: dto.phone,
            country: dto.country,
        });
        await this.customerRepository.save(customer);
        return customer;
    }
}
