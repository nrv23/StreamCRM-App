export interface CreateCustomerDto {
    external_id?: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    createByUser?: number;
    user_id: number;
};