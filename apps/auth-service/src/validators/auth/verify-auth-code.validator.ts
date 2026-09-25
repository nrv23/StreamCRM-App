import { body } from 'express-validator';

export const verifyAuthCodeAuthenticatorValidator = [

    body('challenge_id')
        .exists()
        .withMessage('challenge_id es requerido')
        .isString()
        .trim()
        .isLength({ min: 2 }).withMessage('challenge_id debe tener entre 2 y 50 caracteres'),
    body('auth_code')
        .exists()
        .withMessage('auth_code es requerido')
        .isString()
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage('auth_code debe ser de 6 caracteres')
        .isAlphanumeric()
        .isUppercase()
];
