import { CustomerMapper } from "../../infrastructure/mappers/customer.mapper";
export class CustomerController {
    createCustomerUseCase;
    getCustomerUseCase;
    constructor(createCustomerUseCase, getCustomerUseCase) {
        this.createCustomerUseCase = createCustomerUseCase;
        this.getCustomerUseCase = getCustomerUseCase;
    }
    create = async (req, res) => {
        const customer = await this.createCustomerUseCase.execute(req.body);
        return res.status(201).json({
            success: true,
            data: CustomerMapper.toResponse(customer),
        });
    };
    getById = async (req, res) => {
        const customer = await this.getCustomerUseCase.execute(req.params.id);
        return res.status(200).json({
            success: true,
            data: CustomerMapper.toResponse(customer),
        });
    };
}
