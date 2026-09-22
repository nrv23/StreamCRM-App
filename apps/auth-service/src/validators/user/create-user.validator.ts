import { body } from 'express-validator';

export const createUserValidator = [
    body('email')
        .exists({ checkFalsy: true }).withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .isLength({ max: 200 }).withMessage('El email debe tener un máximo de 200 caracteres')
        .normalizeEmail(),

    body('first_name')
        .exists({ checkFalsy: true }).withMessage('El nombre es requerido')
        .isString().withMessage('El nombre debe ser una cadena de texto')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    body('last_name')
        .exists({ checkFalsy: true }).withMessage('El apellido es requerido')
        .isString().withMessage('El apellido debe ser una cadena de texto')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),

    body('password')
        .exists({ checkFalsy: true }).withMessage('La contraseña es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto')
        .isLength({ min: 6, max: 30 }).withMessage('La contraseña debe tener entre 6 y 30 caracteres')
        .matches(/^[a-zA-Z0-9\-_&^*(%^$#=]+$/).withMessage('La contraseña solo puede contener caracteres alfanuméricos y estos especiales: --_&^*(%^$#='),
    body('role')
        .isString().withMessage('El rol debe ser una cadena de texto')
        .isLength({ min: 6, max: 30 }).withMessage('El rol debe tener entre 6 y 10')
];
