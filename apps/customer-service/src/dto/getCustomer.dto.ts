import { CustomerStatus } from "../enum/CustomerStatus.type.js";

export interface GetCustomerDto {

    email?: string | null;
    phone?: string | null;
    country?: string | null;
    status?: CustomerStatus;
}