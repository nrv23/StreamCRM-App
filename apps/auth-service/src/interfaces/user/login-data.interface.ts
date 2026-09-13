import { IUserDataResponse } from "./user-data.interface.ts";


export interface LoginDataResponse extends IUserDataResponse {
    access_token: string;
    expires_at: number;
}