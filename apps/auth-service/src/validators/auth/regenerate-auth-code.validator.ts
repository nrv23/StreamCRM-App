import { body } from 'express-validator';

export const regenerateAuthCodeAuthenticatorValidator = [

    body('challenge_id')
        .exists()
        .withMessage('challenge_id es requerido')
        .isString()
        .trim()
        .isLength({ min: 2 }).withMessage('challenge_id debe tener entre 2 y 50 caracteres'),
    body('auth_code')
];
