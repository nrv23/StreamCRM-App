import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export interface UpdateCustomerDto {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    status?: CustomerStatus;
};