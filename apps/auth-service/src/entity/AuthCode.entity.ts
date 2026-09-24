import { AuthCodeChannel } from "../enum/AuthCodeChannel.enum.ts";
import { AuthCodePurpose } from "../enum/AuthCodePurpose.enum.ts";
import { AuthCodeStatus } from "../enum/AuthCodeStatus.enum.ts";

export class AuthCode {
    constructor(
        public readonly id: BigInt,
        public external_id: string,
        public user_id: number,
        public code_hash: string,
        public channel: AuthCodeChannel,
        public purpose: AuthCodePurpose,
        public status: AuthCodeStatus,
        public attempts: number,
        public expires_at: Date,
        public used_at: Date | null,
        public revoked_at: Date | null,
        public created_at: Date
    ) {

    }
}
