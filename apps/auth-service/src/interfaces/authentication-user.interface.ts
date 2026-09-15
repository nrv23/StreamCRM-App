export interface AuthenticatedUser {
    id: number;
    roles: string[];
    sid: string;
    sub: string;
}