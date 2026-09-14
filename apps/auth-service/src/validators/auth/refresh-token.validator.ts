import { body, cookie } from 'express-validator';

export const refreshTokenValidator = [
    cookie('refresh_token')
        .exists({ checkFalsy: true }).withMessage('El refresh token es requerido')
        .isString().withMessage('El refresh token debe ser una cadena de texto'),
    
    body('user_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número entero con mínimo 1'),
];
