export class CustomerMapper {
    static toResponse(customer) {
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
