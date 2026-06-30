export class CustomerNotFoundError extends Error {
    constructor(customerId) {
        super(`Customer with id ${customerId} was not found`);
        this.name = "CustomerNotFoundError";
    }
}
export class CustomerAlreadyExistsError extends Error {
    constructor(email) {
        super(`Customer with email ${email} already exists`);
        this.name = "CustomerAlreadyExistsError";
    }
}
