
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.js';
import { AppError } from '../errors/app-errors.js';
import { AuthResponseCode } from '../../responses/auth.responses.ts';

export class ErrorFactory {
    /**
     * Retorna una instancia configurada de AppError según el código del enum
     */
    public static build(enumErrorCode: ApiErrorCode, customMessage?: string): AppError {
        let statusCode = 500; // Por defecto, si algo falla raramente

        switch (enumErrorCode) {
            case ApiErrorCode.NOT_FOUND:
                statusCode = 404;
                break;

            case ApiErrorCode.CONFLICT_ERROR:
                statusCode = 409;
                break;

            case ApiErrorCode.USER_EMAIL_DUPLICATED: // Ambos mapean a 409
                statusCode = 400;
                break;

            case ApiErrorCode.BAD_REQUEST:
                statusCode = 400;
                break;

            case ApiErrorCode.INTERNAL_SERVER_ERROR:
                statusCode = 500;
                break;

            default: throw new Error("Error type not implemented")
        }

        // Resolvemos el mensaje dinámicamente si no se provee uno
        const message = customMessage || AuthResponseCode[enumErrorCode]?.message || "Unexpected error";

        return new AppError(message, statusCode, enumErrorCode);
    }
}