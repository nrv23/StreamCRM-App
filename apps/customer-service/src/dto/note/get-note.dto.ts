

export interface GetNoteDto {
    customer_id: number;
    user_id: number;
    sortOrder: string;
    page?: number | null;
    limit?: number;
}