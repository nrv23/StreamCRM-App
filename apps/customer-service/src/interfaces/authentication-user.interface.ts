export interface AuthenticatedUser {
    id: number;
    email: string;
    roles: string[];
}