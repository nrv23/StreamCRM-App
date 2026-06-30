import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { createCustomerValidator } from "../validators/customer.validator";

export function buildCustomerRoutes(controller: CustomerController): Router {
  const router = Router();

  router.post("/", createCustomerValidator, controller.create);
  router.get("/:id", controller.getById);

  return router;
}
