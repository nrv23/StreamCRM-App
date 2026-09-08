import { UserStatus } from "../../enum/UserStatus.enum.ts";


export interface IUserDataPaginatedDto {
    id: number;
    external_id: string;
    email: string,
    status: UserStatus,
    initial_date: string;
    final_date: string;
    limit?: number;
    offset?: number;
    page?: number;
}