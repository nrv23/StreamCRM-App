
import { ApiErrorCode } from '../../enum/error-codes.enum.js';
import { AppError } from '../errors/app-errors.js';

export class ErrorFactory {
    /**
     * Retorna una instancia configurada de AppError según el código del enum
     */
    public static build(enumErrorCode: ApiErrorCode, message: string, code: string): AppError {
        let statusCode = 500; // Por defecto, si algo falla raramente

        switch (enumErrorCode) {
            case ApiErrorCode.NOT_FOUND:
                statusCode = 404;
                break;

            case ApiErrorCode.CONFLICT_ERROR:
            case ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED: // Ambos mapean a 409
                statusCode = 409;
                break;

            case ApiErrorCode.BAD_REQUEST:
                statusCode = 400;
                break;

            case ApiErrorCode.INTERNAL_SERVER_ERROR:
                statusCode = 500;
                break;

            case ApiErrorCode.CUSTOME_ERROR:
                statusCode = 500;
                break;

            default: throw new Error("Error type not implemented")
        }

        return new AppError(message, statusCode, code);
    }
}