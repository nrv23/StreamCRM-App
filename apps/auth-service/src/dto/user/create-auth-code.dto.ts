import { AuthCodeChannel } from "../../enum/AuthCodeChannel.enum.ts";
import { AuthCodePurpose } from "../../enum/AuthCodePurpose.enum.ts";
import { AuthCodeStatus } from "../../enum/AuthCodeStatus.enum.ts";


export interface CreateAuthCodeDto {
  external_id: string;
  user_id: number;
  code_hash: string;
  channel: AuthCodeChannel;
  purpose: AuthCodePurpose;
  status: AuthCodeStatus;
  expires_at: Date;
}