import { ApiErrorCode } from "../enum/ErrorCodes.enum.js";
interface CodeResponse {
    code: ApiErrorCode;
    message: string;
}
export interface CodeResponseDictionary {
    [key: string]: CodeResponse;
}
export {};
//# sourceMappingURL=ICodeResponse.interface.d.ts.map