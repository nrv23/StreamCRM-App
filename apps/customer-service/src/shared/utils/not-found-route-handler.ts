
// shared/middleware/error.middleware.ts
import { Request, Response } from 'express';
import { ApiResponse } from '../types/api-response.js';


export const notFoundRouteHandler = ( // va en el app .ts

    _: Request,
    res: Response,
): void => {

    const response: ApiResponse<never> = {
        success: false,
        error: {
            code: '404',
            message: "Ruta no encontrada"
        }
    }

    res.status(404).json(response);
    return;
};