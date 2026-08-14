import { CustomerStatus } from "../enum/CustomerStatus.enum.js";
export declare class Customer {
    readonly id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    status: CustomerStatus;
    private constructor();
    changeEmail(email: string): void;
    block(): void;
    activate(): void;
}
//# sourceMappingURL=Customer.entity.d.ts.map