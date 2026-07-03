import { CreateCustomerProps } from "./shared/createCustomerProps.type.js";
import { CustomerStatus } from "./shared/customerStatus.type.js";



export class CreateCustomerDto {
    private constructor(
        public readonly id: string,
        public firstName: string,
        public lastName: string,
        public email: string | null,
        public phone: string | null,
        public country: string | null,
        public status: CustomerStatus,
    ) { }

    static create(props: CreateCustomerProps): CreateCustomerDto {
        if (!props.email && !props.phone) {
            throw new Error("Customer must have email or phone");
        }

        if (props.email && !props.email.includes("@")) {
            throw new Error("Invalid customer email");
        }

        return new CreateCustomerDto(
            props.id,
            props.firstName.trim(),
            props.lastName.trim(),
            props.email?.trim().toLowerCase() ?? null,
            props.phone?.trim() ?? null,
            props.country?.trim() ?? null,
            props.status ?? CustomerStatus.active,
        );
    }
}
