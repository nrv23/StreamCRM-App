import { body } from 'express-validator';
import { UserStatus } from '../../enum/UserStatus.enum.ts';

export const getUsersValidator = [
    body('id')
        .optional()
        .isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo'),

    body('external_id')
        .optional()
        .isString().withMessage('El external_id debe ser una cadena de texto')
        .trim()
        .isUUID().withMessage('El external_id debe ser un UUID válido'),

    body('email')
        .optional()
        .isEmail().withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),

    body('status')
        .optional()
        .isIn(Object.values(UserStatus)).withMessage(`El status debe ser uno de: ${Object.values(UserStatus).join(', ')}`),

    body('initial_date')
        .optional()
        .isISO8601().withMessage('La fecha inicial debe ser una fecha válida en formato ISO8601'),

    body('final_date')
        .optional()
        .isISO8601().withMessage('La fecha final debe ser una fecha válida en formato ISO8601')
        .custom((value, { req }) => {
            if (req.body.initial_date && value < req.body.initial_date) {
                throw new Error('La fecha final no puede ser anterior a la fecha inicial');
            }
            return true;
        }),

    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('El limit debe ser un número entre 1 y 100'),

    body('offset')
        .optional()
        .isInt({ min: 0 }).withMessage('El offset debe ser un número entero mayor o igual a 0'),

    body('page')
        .optional()
        .isInt({ min: 1 }).withMessage('El page debe ser un número entero positivo')
];
