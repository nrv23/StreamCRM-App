

export interface GetNoteDto {
    customer_id: number;
    user_id: number;
    created_at: string;
    page?: number | null;
    limit?: number;
    orderBy: string;
}