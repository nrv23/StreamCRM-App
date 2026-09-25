

export interface AuthCodeDataResponse {
    requires_2fa: boolean
    challeneg_id: string;
    auth_code: string;
}