import { body, param } from 'express-validator';
import { RoleStatus } from '../../enum/RoleStatus.enum.ts';

export const SetUserRolesValidator = [
    param('userid')
        .optional()
        .isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo'),
    body('roles')
        .exists().withMessage('El campo roles es obligatorio')
        .isArray({ min: 1 }).withMessage('El campo roles debe ser un array con al menos 1 elemento'),

    // 2. Validar cada elemento individual dentro del array
    body('roles.*')
        .isInt({ min: 1 }).withMessage('Cada rol debe ser un número entero mayor o igual a 1')
        .toInt(), // Opcional: castea los valores a tipo number
    body('status')
        .isIn(Object.values(RoleStatus)).withMessage(`El status debe ser uno de: ${Object.values(RoleStatus).join(', ')}`),
];


