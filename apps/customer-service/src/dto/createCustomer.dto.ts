import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export interface CreateCustomerDto {
    id?: string;
    external_id?: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    createByUser?: number;
};