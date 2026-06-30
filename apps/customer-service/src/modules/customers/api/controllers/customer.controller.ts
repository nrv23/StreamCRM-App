import { Request, Response } from "express";
import { CreateCustomerUseCase } from "../../application/use-cases/create-customer.use-case.js";
import { GetCustomerUseCase } from "../../application/use-cases/get-customer.use-case.js";

import { CustomerMapper } from "../../infrastructure/mappers/customer.mapper.js";
import { TestCaseCustome } from "../../application/use-cases/test-case.user-case.js";

export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly testCaseCustome: TestCaseCustome
  ) { }

  create = async (req: Request, res: Response) => {
    const customer = await this.createCustomerUseCase.execute(req.body);

    return res.status(201).json({
      success: true,
      data: CustomerMapper.toResponse(customer),
    });
  };

  getById = async (req: Request, res: Response) => {
    const customer = await this.getCustomerUseCase.execute('' + req.params.id);

    return res.status(200).json({
      success: true,
      data: CustomerMapper.toResponse(customer),
    });
  };

  test = async (req: Request, res: Response) => {
    console.log("llego a test")
    const testResponse = await this.testCaseCustome.execute([]);

    return res.status(200).json({
      success: true,
      data: testResponse?.now,
    });
  }
}
