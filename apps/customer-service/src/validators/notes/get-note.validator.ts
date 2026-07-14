import { query } from 'express-validator';

export const getNoteValidator = [
    query('customer_id')
        .optional({
            nullable: true
        })
        .isInt({ min: 1 })
        .withMessage('customer_id debe ser un número entero mayor a 0')
        .toInt(),
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
    query('sortOrder')
        .optional({
            nullable: true
        })
        .isString()
        .isIn(['asc', 'desc', 'ASC', 'DESC'])
        .withMessage('sortOrder debe ser asc o desc')
        .trim()
];
