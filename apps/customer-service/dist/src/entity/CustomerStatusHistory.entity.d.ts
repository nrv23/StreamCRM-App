import { CustomerStatus } from "../enum/CustomerStatus.enum.js";
export declare class CustomerStatusHistory {
    readonly id: number;
    customer_id: number;
    previous_status: CustomerStatus;
    new_status: CustomerStatus;
    changed_by_user_id: number;
    created_at: string;
    constructor(id: number, customer_id: number, previous_status: CustomerStatus, new_status: CustomerStatus, changed_by_user_id: number, created_at: string);
}
//# sourceMappingURL=CustomerStatusHistory.entity.d.ts.map