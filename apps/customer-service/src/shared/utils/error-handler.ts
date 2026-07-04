// shared/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api-response.js';
import { AppError } from '../errors/app-errors.js';

export const errorHandler = ( // va en el app .ts
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // 1. Si es un error controlado por nosotros (AppError)
    if (err instanceof AppError) {
        const response: ApiResponse<never> = {
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        };

        res.status(err.statusCode).json(response);
        return;
    } else {

        // 2. Si es un error inesperado (Postgres abajo, error de código, etc.)
        console.error('💥 Error no controlado:', err);

        const internalResponse: ApiResponse<never> = {
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Ocurrió un error inesperado en el servidor'
            }
        };

        res.status(500).json(internalResponse);
    }
};