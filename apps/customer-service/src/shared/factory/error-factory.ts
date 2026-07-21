
import { ApiErrorCode } from '../../enum/error-codes.enum.js';
import { AppError } from '../errors/app-errors.js';

export class ErrorFactory {
    /**
     * Retorna una instancia configurada de AppError según el código del enum
     */
    public static build(enumErrorCode: ApiErrorCode, message: string): AppError {
        let statusCode = 500; // Por defecto, si algo falla raramente
        let code: string;

        switch (enumErrorCode) {
            case ApiErrorCode.NOT_FOUND:
                statusCode = 404;
                code = ApiErrorCode.NOT_FOUND;
                break;

            case ApiErrorCode.CONFLICT_ERROR:
                statusCode = 409;
                code = ApiErrorCode.CONFLICT_ERROR;
                break;

            case ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED: // Ambos mapean a 409
                statusCode = 400;
                code = ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED;
                break;

            case ApiErrorCode.BAD_REQUEST:
                statusCode = 400;
                code = ApiErrorCode.BAD_REQUEST;
                break;

            case ApiErrorCode.INTERNAL_SERVER_ERROR:
                statusCode = 500;
                code = ApiErrorCode.INTERNAL_SERVER_ERROR;
                break;

            default: throw new Error("Error type not implemented")
        }

        return new AppError(message, statusCode, code);
    }
}