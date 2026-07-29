import { CustomerStatus } from "../enum/CustomerStatus.enum.js";

export class Customer {
    private constructor(
        public readonly id: number,
        public first_name: string,
        public last_name: string,
        public email: string | null,
        public phone: string | null,
        public country: string | null,
        public status: CustomerStatus,
    ) { }


    changeEmail(email: string) {

        this.email = email.trim().toLowerCase();
    }

    block() {
        this.status = CustomerStatus.blocked;
    }

    activate() {
        this.status = CustomerStatus.active;
    }
}