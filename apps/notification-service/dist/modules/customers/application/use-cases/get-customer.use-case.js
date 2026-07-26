import { CustomerNotFoundError } from "../../domain/errors/customer.errors";
export class GetCustomerUseCase {
    customerRepository;
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async execute(id) {
        const customer = await this.customerRepository.findById(id);
        if (!customer) {
            throw new CustomerNotFoundError(id);
        }
        return customer;
    }
}
