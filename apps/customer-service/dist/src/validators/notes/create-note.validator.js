import { body, param } from 'express-validator';
export const createNoteValidator = [
    param('customer_id')
        .isInt()
        .withMessage('Customer ID debe ser un número entero válido')
        .toInt(),
    body('note')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('note es requerido')
        .isLength({ min: 2, max: 50 })
        .withMessage('note debe tener entre 2 y 50 caracteres')
        .customSanitizer((value, { req }) => {
        req.body.note = value;
        return value;
    })
];
//# sourceMappingURL=create-note.validator.js.map