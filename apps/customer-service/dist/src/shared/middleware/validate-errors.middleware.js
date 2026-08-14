import { validationResult } from 'express-validator';
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    // 1. Si hay errores de validación, cortamos el flujo inmediatamente
    if (!errors.isEmpty()) {
        const response = {
            error: {
                code: "400",
                message: errors.array({
                    onlyFirstError: true
                }).map(message => message),
            },
            success: false
        };
        res.status(400).json(response);
        return;
    }
    next();
    return;
};
//# sourceMappingURL=validate-errors.middleware.js.map