// shared/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult, matchedData } from 'express-validator';
import { ApiResponse } from './../types/api-response.js';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    // 1. Si hay errores de validación, cortamos el flujo inmediatamente
    if (!errors.isEmpty()) {

        const response: ApiResponse<null> = {
            error: {
                code: "400",
                message: errors.array({
                    onlyFirstError: true
                }).map(message => message),
            },
            success: false
        }
        res.status(400).json(response);
        return;
    }

    next();
    return;
};