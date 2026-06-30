import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { createCustomerValidator } from "../validators/customer.validator.js";

export function buildCustomerRoutes(controller: CustomerController): Router {
  const router = Router();

  router.post("/", createCustomerValidator, controller.create);
  router.get("/:id", controller.getById);
  router.get("/test/test-query", controller.test)

  return router;
}
