import { cookie } from 'express-validator';

export const logoutValidator = [
    cookie('refresh_token')
        .exists({ checkFalsy: true }).withMessage('El refresh token es requerido')
        .isString().withMessage('El refresh token debe ser una cadena de texto')
];
