import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export class Customer {
    private constructor(
        public readonly id: string,
        public firstName: string,
        public lastName: string,
        public email: string | null,
        public phone: string | null,
        public country: string | null,
        public status?: CustomerStatus | null,
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