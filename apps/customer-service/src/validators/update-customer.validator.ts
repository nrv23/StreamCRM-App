import { param, body } from 'express-validator';
import { CustomerStatus } from '../enum/CustomerStatus.type.js';

export const updateCustomerValidator = [
    param('id')
        .isInt()
        .withMessage('El ID del cliente debe ser un número entero válido')
        .toInt(),

    body('firstName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name debe tener entre 2 y 50 caracteres'),

    body('lastName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name debe tener entre 2 y 50 caracteres'),

    body('email')
        .optional({ nullable: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Email no válido'),

    body('phone')
        .optional({ nullable: true })
        .isString()
        .trim()
];
