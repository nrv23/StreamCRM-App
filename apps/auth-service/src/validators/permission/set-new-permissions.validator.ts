import { body, param } from "express-validator";
import { RoleStatus } from "../../enum/RoleStatus.enum.ts";

export const SetNewPermissionsValidator = [
    param("userid")
        .exists().withMessage("El parámetro userid es obligatorio")
        .isInt({ min: 1 }).withMessage("El id debe ser un número entero positivo")
        .toInt(),

    body("role_id")
        .exists().withMessage("El campo role_id es obligatorio")
        .isInt({ min: 1 }).withMessage("El campo role_id debe ser un número entero positivo")
        .toInt(),

    body("status")
        .optional()
        .isIn(Object.values(RoleStatus)).withMessage(`El status debe ser uno de: ${Object.values(RoleStatus).join(", ")}`),

    body("permissions")
        .exists().withMessage("El campo permissions es obligatorio")
        .isArray({ min: 1 }).withMessage("El campo permissions debe ser un array con al menos 1 elemento"),

    body("permissions.*.code")
        .exists().withMessage("Cada permiso debe incluir la propiedad code")
        .isString().withMessage("El código de permiso debe ser una cadena de texto no vacía")
        .trim()
        .notEmpty().withMessage("El código del permiso no puede estar vacío"),
];
