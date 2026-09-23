import { body } from "express-validator";

export const CreateRoleValidator = [
    body("role")
        .exists({ checkFalsy: true }).withMessage("El campo role es obligatorio")
        .isString().withMessage("El rol debe ser una cadena de texto")
        .trim()
        .isLength({ min: 5, max: 10 }).withMessage("El rol debe tener entre 5 y 10 caracteres"),

    body("permissions")
        .exists().withMessage("El campo permissions es obligatorio")
        .isArray({ min: 1 }).withMessage("El campo permissions debe ser un array con al menos 1 elemento"),

    body("permissions.*")
        .isString().withMessage("Cada permiso debe ser una cadena de texto")
        .trim()
        .isLength({ min: 10, max: 20 }).withMessage("Cada permiso debe tener entre 10 y 20 caracteres"),

    body("description")
        .optional()
        .isString().withMessage("La descripción debe ser una cadena de texto")
        .trim()
        .isLength({ max: 100 }).withMessage("La descripción debe tener un máximo de 100 caracteres"),
];
