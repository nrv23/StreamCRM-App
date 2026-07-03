import { CustomerStatus } from "../dtos/shared/customerStatus.type.js";

export class Customer {
  private constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string | null,
    public phone: string | null,
    public country: string | null,
    public status: CustomerStatus,
  ) { }

  public static fromObject(object: { [key: string]: any }) {

    const { id, firstName, lastName, email, phone, country, status } = object;
    return new Customer(
      id || null,
      firstName.trim(),
      lastName.trim(),
      email?.trim().toLowerCase() || null,
      phone?.trim() || null,
      country?.trim() || null,
      status || null,
    )
  }
}
