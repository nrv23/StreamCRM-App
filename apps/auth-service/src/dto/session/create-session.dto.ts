

export interface CreateSessionDto {
    user_id: number;
    session_id: string;
    ip_address: string;
    user_agent: string;
}