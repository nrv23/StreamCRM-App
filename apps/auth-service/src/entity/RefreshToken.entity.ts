

export class RefreshToken {
    constructor(
        public id: number,
        public user_id: number,
        public token_hash: string,
        public revoked_at: string,
        public expires_at: string,
        public created_at: string
    ) {

    }
}