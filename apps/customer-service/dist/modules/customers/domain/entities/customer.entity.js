export class Customer {
    id;
    firstName;
    lastName;
    email;
    phone;
    country;
    status;
    constructor(id, firstName, lastName, email, phone, country, status) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.country = country;
        this.status = status;
    }
    static create(props) {
        if (!props.email && !props.phone) {
            throw new Error("Customer must have email or phone");
        }
        if (props.email && !props.email.includes("@")) {
            throw new Error("Invalid customer email");
        }
        return new Customer(props.id, props.firstName.trim(), props.lastName.trim(), props.email?.trim().toLowerCase() ?? null, props.phone?.trim() ?? null, props.country?.trim() ?? null, props.status ?? "active");
    }
    changeEmail(email) {
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
