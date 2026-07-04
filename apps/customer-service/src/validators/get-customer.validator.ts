import { query } from 'express-validator';
import { CustomerStatus } from '../enum/CustomerStatus.type.js';

export const getCustomerValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page debe ser un número entero mayor a 0')
        .toInt(),

    query('country')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 2 })
        .withMessage('Country debe ser un código de 2 letras (ej: CR)'),

    query('status')
        .optional()
        .isIn(Object.values(CustomerStatus))
        .withMessage(`Status debe ser válido (${Object.values(CustomerStatus).join(', ')})`),

    query('search')
        .optional()
        .isString()
        .trim(),

    query('sortBy')
        .exists({ checkFalsy: true })
        .withMessage('sortBy es requerido')
        .isString()
        .trim(),

    query('orderBy')
        .exists({ checkFalsy: true })
        .withMessage('orderBy es requerido')
        .isString()
        .isIn(['asc', 'desc', 'ASC', 'DESC'])
        .withMessage('orderBy debe ser asc o desc')
        .trim()
];
