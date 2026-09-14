

export class RefreshToken {
    constructor(
        public readonly id: number,
        public user_id: number,
        public session_id: string,
        public token_hash: string,
        public revoked_at: string,
        public expires_at: string,
        public created_at: string
    ) {

    }
}