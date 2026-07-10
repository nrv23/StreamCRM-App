import { body, param } from 'express-validator';

export const createTagValidator = [
    param('customerId')
        .isInt()
        .withMessage('Customer ID debe ser un número entero válido')
        .toInt(),

    body('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name debe tener entre 2 y 50 caracteres')
        .customSanitizer((value, { req }) => {
            req.body.name = value;
            return value;
        })
];
