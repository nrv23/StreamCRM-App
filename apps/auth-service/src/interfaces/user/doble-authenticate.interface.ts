import { CreateAuthCodeDto } from "../../dto/user/create-auth-code.dto.ts";
import { AuthCode } from "../../entity/AuthCode.entity.ts";
import { AuthCodeStatus } from "../../enum/AuthCodeStatus.enum.ts";
import { GetCodeAuthenticatorDataResponse } from "../../repository/user/2fa.repository.ts";


export interface IDobleAuthenticateRepositpry {

    saveCodeAuthenticator(dto: CreateAuthCodeDto): Promise<AuthCode>;
    getCodeAuthenticatorData(external_id: string, user_id: number): Promise<GetCodeAuthenticatorDataResponse | undefined>;
    setStatusCodeAuthenticator(external_id: string, user_id: number, status: AuthCodeStatus): Promise<void>;
    setAttemps(): Promise<void>
}