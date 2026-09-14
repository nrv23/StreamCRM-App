import { body } from 'express-validator';

export const loginValidator = [
    body('email')
        .exists({ checkFalsy: true }).withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .isLength({ max: 200 }).withMessage('El email debe tener un máximo de 200 caracteres')
        .normalizeEmail(),

    body('password')
        .exists({ checkFalsy: true }).withMessage('La contraseña es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto')
        .isLength({ min: 6, max: 30 }).withMessage('La contraseña debe tener entre 6 y 30 caracteres')
        .matches(/^[a-zA-Z0-9\-_&^*(%^$#=]+$/).withMessage('La contraseña solo puede contener caracteres alfanuméricos y estos especiales: --_&^*(%^$#=')
];
