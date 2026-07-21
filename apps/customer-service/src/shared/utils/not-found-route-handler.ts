
// shared/middleware/error.middleware.ts
import { Request, Response } from 'express';
import { ApiResponse } from '../types/api-response.js';
import { CustomerResponseCode } from '../../responses/customer.responses.js';
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.js';


export const notFoundRouteHandler = ( // va en el app .ts

    _: Request,
    res: Response,
): void => {

    const response: ApiResponse<never> = {
        success: false,
        error: {
            code: CustomerResponseCode[ApiErrorCode.ROUTE_NOT_FOUND]!.code,
            message: CustomerResponseCode[ApiErrorCode.ROUTE_NOT_FOUND]!.message
        }
    }

    res.status(404).json(response);
    return;
};