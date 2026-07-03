import { CustomerStatus } from "./customerStatus.type.js";

export type CreateCustomerProps = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    status?: CustomerStatus;
};