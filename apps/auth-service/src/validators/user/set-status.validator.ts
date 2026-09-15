import { body, param } from 'express-validator';
import { UserStatus } from '../../enum/UserStatus.enum.ts';

export const SetStatusUserValidator = [
    param('id')
        .optional()
        .isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo'),
    body('status')
        .isIn(Object.values(UserStatus)).withMessage(`El status debe ser uno de: ${Object.values(UserStatus).join(', ')}`),
];
