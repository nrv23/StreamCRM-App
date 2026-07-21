import { CustomerStatus } from "../../enum/CustomerStatus.enum.js";


export interface ChangeCustomerHistoryStatusDto {
    customer_id: number;
    previous_status: CustomerStatus;
    new_status: CustomerStatus;
    changed_by_userId: number;
}