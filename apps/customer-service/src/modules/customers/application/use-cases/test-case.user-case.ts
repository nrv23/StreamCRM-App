import crypto from "node:crypto";
import { Customer } from "../../domain/entities/customer.entity.js";
import { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import { CustomerAlreadyExistsError } from "../../domain/errors/customer.errors.js";
import { CreateCustomerDto } from "../dto/create-customer.dto.js";
import { INow } from "../../interfaces/now.js";

export class TestCaseCustome {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute(params: any = []): Promise<INow | null> {
        console.log("llegó")
        return await this.customerRepository.testQuery(params);
    }
}
