export type CustomerStatus = "active" | "inactive" | "blocked";

type CreateCustomerProps = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  status?: CustomerStatus;
};

export class Customer {
  private constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public email: string | null,
    public phone: string | null,
    public country: string | null,
    public status: CustomerStatus,
  ) {}

  static create(props: CreateCustomerProps): Customer {
    if (!props.email && !props.phone) {
      throw new Error("Customer must have email or phone");
    }

    if (props.email && !props.email.includes("@")) {
      throw new Error("Invalid customer email");
    }

    return new Customer(
      props.id,
      props.firstName.trim(),
      props.lastName.trim(),
      props.email?.trim().toLowerCase() ?? null,
      props.phone?.trim() ?? null,
      props.country?.trim() ?? null,
      props.status ?? "active",
    );
  }

  changeEmail(email: string) {
    if (!email.includes("@")) {
      throw new Error("Invalid customer email");
    }

    this.email = email.trim().toLowerCase();
  }

  block() {
    this.status = "blocked";
  }

  activate() {
    this.status = "active";
  }
}
