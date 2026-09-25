import { AuthCodeDataResponse } from "../../interfaces/user/authcode-data.interface.ts";
import { LoginDataResponse } from "../../interfaces/user/login-data.interface.ts";


export class InterfaceValidatorData {

    isLoginResponseData(obj: unknown): obj is LoginDataResponse {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'refresh_token' in obj &&
            typeof (obj as LoginDataResponse).refresh_token === 'string'
        );
    }

    isAuthCodeResponseData(obj: unknown): obj is AuthCodeDataResponse {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'external_id' in obj &&
            typeof (obj as AuthCodeDataResponse).external_id === 'string'
        );
    }
}