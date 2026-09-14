import { SessionRevokedReasonEnum } from "../enum/SessionRevokedReason.enum.ts";
import { SessionStatus } from "../enum/SessionStatus.enum.ts";

export class Session {

    constructor(
        public readonly id: number,
        public session_id: string,
        public user_id: number,
        public status: SessionStatus,
        public ip_address: string,
        public user_agent: string,
        public created_at: Date,
        public expires_at: Date,
        public ended_at: Date,
        public revoked_at: Date,
        public revoked_reason: SessionRevokedReasonEnum
    ) {

    }
}