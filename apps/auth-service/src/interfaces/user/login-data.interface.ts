import { IUserDataResponse } from "./user-data.interface.ts";


export interface LoginDataResponse extends IUserDataResponse {
    token: string
}