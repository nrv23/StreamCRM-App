export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer with id ${customerId} was not found`);
    this.name = "CustomerNotFoundError";
  }
}

export class CustomerAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Customer with email ${email} already exists`);
    this.name = "CustomerAlreadyExistsError";
  }
}
