import { query } from 'express-validator';

export const getNoteValidator = [
    query('customer_id')
        .exists({ checkFalsy: true })
        .withMessage('customer_id es requerido')
        .isInt({ min: 1 })
        .withMessage('customer_id debe ser un número entero mayor a 0')
        .toInt(),
    query('created_at')
        .exists({ checkFalsy: true })
        .withMessage('created_at es requerido')
        .isString()
        .trim(),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero mayor a 0')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('limit debe ser un número entero mayor a 0')
        .toInt(),
    query('orderBy')
        .exists({ checkFalsy: true })
        .withMessage('orderBy es requerido')
        .isString()
        .isIn(['asc', 'desc', 'ASC', 'DESC'])
        .withMessage('orderBy debe ser asc o desc')
        .trim()
];
