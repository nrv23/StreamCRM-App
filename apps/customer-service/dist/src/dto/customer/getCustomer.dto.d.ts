import { CustomerStatus } from "../../enum/CustomerStatus.enum.js";
export interface GetCustomerDto {
    page?: number | null;
    country?: string | null;
    status?: CustomerStatus;
    search?: string | null;
    sortBy: string;
    orderBy: string;
    limit?: number;
}
//# sourceMappingURL=getCustomer.dto.d.ts.map