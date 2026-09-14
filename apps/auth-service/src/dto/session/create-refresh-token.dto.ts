

export interface CreateRefreshTokenDto {
    user_id: number,
    session_id: string,
    token_hash: string,
    expires_at: Date,
}