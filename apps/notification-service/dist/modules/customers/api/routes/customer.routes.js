import { Router } from "express";
import { createCustomerValidator } from "../validators/customer.validator";
export function buildCustomerRoutes(controller) {
    const router = Router();
    router.post("/", createCustomerValidator, controller.create);
    router.get("/:id", controller.getById);
    return router;
}
