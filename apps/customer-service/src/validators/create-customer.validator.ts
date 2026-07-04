// shared/validators/customer.validator.ts
import { body } from 'express-validator';

export const createCustomerValidator = [
    body('external_id').isUUID().withMessage('External ID debe ser un UUID válido'),

    body('first_name')
        .isString().trim().isLength({ min: 2, max: 50 }).withMessage('First name requerido (2-50 caracteres)')
        .customSanitizer((value, { req }) => {
            req.body.firstName = value; // Inyectamos la versión camelCase
            return value;
        }),

    body('last_name')
        .isString().trim().isLength({ min: 2, max: 50 }).withMessage('Last name requerido (2-50 caracteres)')
        .customSanitizer((value, { req }) => {
            req.body.lastName = value;
            return value;
        }),

    body('email').isEmail().normalizeEmail().withMessage('Email no válido'),

    body('phone').optional().isString().trim(),

    body('country').isString().isLength({ min: 2, max: 2 }).withMessage('Country debe ser código de 2 letras (ej: CR)'),

    body('created_by_user_id')
        .toInt().withMessage('Created by user debe ser un UUID válido')
        .customSanitizer((value, { req }) => {
            req.body.createByUser = value;
            return value;
        })
];