import { CustomerStatus } from "../../enum/CustomerStatus.enum.js";

export interface UpdateCustomerDto {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    user_id: number;
    ip_address: string;
    user_agent: string;
};