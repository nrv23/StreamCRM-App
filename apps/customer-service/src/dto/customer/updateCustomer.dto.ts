import { CustomerStatus } from "../../enum/CustomerStatus.type.js";

export interface UpdateCustomerDto {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
};