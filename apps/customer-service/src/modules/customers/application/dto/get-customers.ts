import { IPaginationOptions } from "../../../../shared/interfaces/IPaginationOptions.js";

export type GetCustomerResponseDto = {
  data: IPaginationOptions<{
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    status: string;
  }>
};
