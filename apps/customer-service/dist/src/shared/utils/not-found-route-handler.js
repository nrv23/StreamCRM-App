import { CustomerResponseCode } from '../../responses/customer.responses.js';
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.js';
export const notFoundRouteHandler = (// va en el app .ts
_, res) => {
    const response = {
        success: false,
        error: {
            code: CustomerResponseCode[ApiErrorCode.ROUTE_NOT_FOUND].code,
            message: CustomerResponseCode[ApiErrorCode.ROUTE_NOT_FOUND].message
        }
    };
    res.status(404).json(response);
    return;
};
//# sourceMappingURL=not-found-route-handler.js.map