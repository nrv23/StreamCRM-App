
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { CodeResponseDictionary } from "../interfaces/ICodeResponse.interface.js";

export const CustomerResponseCode: CodeResponseDictionary = {
    [ApiErrorCode.INTERNAL_SERVER_ERROR]: {
        code: ApiErrorCode.INTERNAL_SERVER_ERROR,
        message: "Internal server error"
    },
    [ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED]: {
        code: ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED,
        message: "Email already exists"
    },
    [ApiErrorCode.INVALID_PASSWORD]: {
        code: ApiErrorCode.INVALID_PASSWORD,
        message: "Invalid credentials"
    },
    [ApiErrorCode.NOT_FOUND]: {
        code: ApiErrorCode.NOT_FOUND,
        message: "Customer not found"
    },
    [ApiErrorCode.CONFLICT_ERROR]: {
        code: ApiErrorCode.CONFLICT_ERROR,
        message: "There was an error in the transaction"
    },
    [ApiErrorCode.BAD_REQUEST]: {
        code: ApiErrorCode.BAD_REQUEST,
        message: "Invalid request data"
    },
    [ApiErrorCode.ROUTE_NOT_FOUND]: {
        code: ApiErrorCode.ROUTE_NOT_FOUND,
        message: "Route not found"
    }
};