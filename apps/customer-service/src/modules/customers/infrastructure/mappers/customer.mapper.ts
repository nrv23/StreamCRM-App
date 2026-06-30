import { Customer } from "../../domain/entities/customer.entity";
import { CustomerResponseDto } from "../../application/dto/customer-response.dto";

export class CustomerMapper {
  static toResponse(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      country: customer.country,
      status: customer.status,
    };
  }
}
