import { Request, Response } from "express";
import { CreateCustomerUseCase } from "../../application/use-cases/create-customer.use-case";
import { GetCustomerUseCase } from "../../application/use-cases/get-customer.use-case";
import { CustomerMapper } from "../../infrastructure/mappers/customer.mapper";

export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
  ) {}

  create = async (req: Request, res: Response) => {
    const customer = await this.createCustomerUseCase.execute(req.body);

    return res.status(201).json({
      success: true,
      data: CustomerMapper.toResponse(customer),
    });
  };

  getById = async (req: Request, res: Response) => {
    const customer = await this.getCustomerUseCase.execute(req.params.id);

    return res.status(200).json({
      success: true,
      data: CustomerMapper.toResponse(customer),
    });
  };
}
