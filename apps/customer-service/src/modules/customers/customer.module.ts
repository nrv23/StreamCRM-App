import { CustomerController } from "./api/controllers/customer.controller.js";
import { buildCustomerRoutes } from "./api/routes/customer.routes.js";
import { CreateCustomerUseCase } from "./application/use-cases/create-customer.use-case.js";
import { GetCustomerUseCase } from "./application/use-cases/get-customer.use-case.js";
import { TestCaseCustome } from "./application/use-cases/test-case.user-case.js";
import { PostgresCustomerRepository } from "./infrastructure/repositories/postgres-customer.repository.js";

const customerRepository = new PostgresCustomerRepository();

const createCustomerUseCase = new CreateCustomerUseCase(customerRepository);
const getCustomerUseCase = new GetCustomerUseCase(customerRepository);
const testCaseCustome = new TestCaseCustome(customerRepository);

const customerController = new CustomerController(
  createCustomerUseCase,
  getCustomerUseCase,
  testCaseCustome
);

export const customerRoutes = buildCustomerRoutes(customerController);
