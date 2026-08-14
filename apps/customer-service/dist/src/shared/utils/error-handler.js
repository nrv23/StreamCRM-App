import { AppError } from '../errors/app-errors.js';
import { CustomerResponseCode } from '../../responses/customer.responses.js';
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.js';
export const errorHandler = (// va en el app .ts
err, req, res, next) => {
    // 1. Si es un error controlado por nosotros (AppError)
    if (err instanceof AppError) {
        const response = {
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        };
        res.status(err.statusCode).json(response);
        return;
    }
    else {
        // 2. Si es un error inesperado (Postgres abajo, error de código, etc.)
        console.error('💥 Error no controlado:', err);
        const internalResponse = {
            success: false,
            error: {
                code: CustomerResponseCode[ApiErrorCode.INTERNAL_SERVER_ERROR].code,
                message: CustomerResponseCode[ApiErrorCode.INTERNAL_SERVER_ERROR].message
            }
        };
        res.status(500).json(internalResponse);
        return;
    }
};
//# sourceMappingURL=error-handler.js.map