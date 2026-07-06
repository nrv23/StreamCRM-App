import { param, body } from 'express-validator';
import { CustomerStatus } from '../enum/CustomerStatus.type.js';

export const deleteCustomerValidator = [
    param('id')
        .isInt()
        .withMessage('El ID del cliente debe ser un número entero válido')
        .toInt(),

    body('status')
        .exists({ checkFalsy: true })
        .withMessage('El estado es requerido para deshabilitar/bloquear al cliente')
        .isIn(Object.values(CustomerStatus))
        .withMessage(`El estado debe ser uno de los siguientes: ${Object.values(CustomerStatus).join(', ')}`)
];
