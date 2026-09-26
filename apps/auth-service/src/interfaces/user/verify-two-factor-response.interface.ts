import { LoginDataResponse } from "./login-data.interface.ts";

export interface VerifyTwoFactorAuthenticateResponse {
    success: boolean;
    expired: boolean;
    maxAttempsFailed: boolean;
    attemptsLeft: number;
    loginData?: LoginDataResponse;
}
