
import { CustomeInvalidDataError } from "../errors/customer.errors.js";
import { CustomerStatus } from "./shared/customerStatus.type.js";



export class GetCustomerDto {

    constructor(
        public email: string | null,
        public phone: string | null,
        public country: string | null,
        public status: CustomerStatus,
    ) {

        this.email = email;
        this.phone = phone;
        this.country = country;
        this.status = status;

        this.validateData();
    }

    private validateData() {
        if (!this.email || !this.email.includes("@")) throw new CustomeInvalidDataError("Invalid email");
        if (!this.phone || this.phone.length < 20) throw new CustomeInvalidDataError("Invalid phone");
        if (!Object.values(CustomerStatus).includes(this.status as CustomerStatus)) { // valiar que el enum exista en el valor enviado
            throw new CustomeInvalidDataError("Invalid customer status");
        }

        if (!this.country) throw new CustomeInvalidDataError("Invalid country");
    }

}