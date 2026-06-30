import { body } from "express-validator";
export const createCustomerValidator = [
    body("firstName").isString().notEmpty(),
    body("lastName").isString().notEmpty(),
    body("email").optional({ nullable: true }).isEmail(),
    body("phone").optional({ nullable: true }).isString(),
    body("country").optional({ nullable: true }).isString(),
];
