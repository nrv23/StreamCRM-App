import { CreateAuthCodeDto } from "../../dto/user/create-auth-code.dto.ts";
import { AuthCode } from "../../entity/AuthCode.entity.ts";
import { AuthCodePurpose } from "../../enum/AuthCodePurpose.enum.ts";
import { AuthCodeStatus } from "../../enum/AuthCodeStatus.enum.ts";
import { GetCodeAuthenticatorDataResponse, GetNewCodeAuthenticator, HasAnyAuthCodeByPurposeAndUserIdAndStatusResponse, IsEnabledTwoFactorAuthenticator, IsLockedTwoFactorAuthenticator } from "../../repository/user/authcode_authenticator.repository.ts";


export interface IDobleAuthenticateRepositpry {

    getNewCodeAuthenticator(): Promise<GetNewCodeAuthenticator>;
    saveCodeAuthenticator(dto: CreateAuthCodeDto): Promise<AuthCode>;
    getCodeAuthenticatorData(external_id: string, user_id: number): Promise<GetCodeAuthenticatorDataResponse | undefined>;
    setStatusCodeAuthenticator(external_id: string, user_id: number, status: AuthCodeStatus): Promise<void>;
    setAttemps(user_id: number, external_id: string): Promise<void>;
    lockTwoFactorAuthenticator(reason: string, user_id: number): Promise<void>;
    isEnabledTwoFactorAuthenticator(user_id: number): Promise<IsEnabledTwoFactorAuthenticator>;
    isLockedTwoFactorAuthenticator(user_id: number): Promise<IsLockedTwoFactorAuthenticator>;
    hasAnyAuthCodeByPurposeAndUserIdAndStatus(user_id: number, purpose: AuthCodePurpose, status: AuthCodeStatus): Promise<HasAnyAuthCodeByPurposeAndUserIdAndStatusResponse>;
}