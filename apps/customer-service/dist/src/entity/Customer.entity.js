import { CustomerStatus } from "../enum/CustomerStatus.enum.js";
export class Customer {
    id;
    first_name;
    last_name;
    email;
    phone;
    country;
    status;
    constructor(id, first_name, last_name, email, phone, country, status) {
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.email = email;
        this.phone = phone;
        this.country = country;
        this.status = status;
    }
    changeEmail(email) {
        this.email = email.trim().toLowerCase();
    }
    block() {
        this.status = CustomerStatus.blocked;
    }
    activate() {
        this.status = CustomerStatus.active;
    }
}
//# sourceMappingURL=Customer.entity.js.map