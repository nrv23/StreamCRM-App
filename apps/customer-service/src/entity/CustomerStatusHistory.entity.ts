import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export class CustomerStatusHistory {
    constructor(
        public readonly id: number,
        public customer_id: number,
        public previous_status: CustomerStatus,
        public new_status: CustomerStatus,
        public changed_by_user_id: number,
        public created_at: string,
    ) { }
}