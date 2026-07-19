

export interface CreateNoteDto {
    user_id: number;
    customer_id: number;
    note: string;
    ip_address: string;
    user_agent: string;
};