// shared/validators/customer.validator.ts
import { body } from 'express-validator';
export const createCustomerValidator = [
    body('firstName')
        .isString().trim().isLength({ min: 2, max: 50 }).withMessage('First name requerido (2-50 caracteres)')
        .customSanitizer((value, { req }) => {
        req.body.firstName = value; // Inyectamos la versión camelCase
        return value;
    }),
    body('lastName')
        .isString().trim().isLength({ min: 2, max: 50 }).withMessage('Last name requerido (2-50 caracteres)')
        .customSanitizer((value, { req }) => {
        req.body.lastName = value;
        return value;
    }),
    body('email').isEmail().normalizeEmail().withMessage('Email no válido'),
    body('phone').optional().isString().trim(),
    body('country').isString().isLength({ min: 2, max: 2 }).withMessage('Country debe ser código de 2 letras (ej: CR)'),
    body('createByUser')
        .isInt()
        .withMessage('Created by user debe ser un int válido')
        .toInt()
        .customSanitizer((value, { req }) => {
        req.body.createByUser = value;
        return value;
    })
];
//# sourceMappingURL=create-customer.validator.js.map