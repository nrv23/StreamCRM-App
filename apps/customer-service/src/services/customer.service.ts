import { GetCustomerDto } from "../dto/getCustomer.dto.js";
import { Customer } from "../entity/customer.entity.js";
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { ICustomerRepository } from "../interfaces/customer-repository.interface.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";
import { CreateCustomerDto } from './../dto/createCustomer.dto.js'


export class CustomerService {

    private _customerRepository: ICustomerRepository;

    constructor(customerRepository: ICustomerRepository) {
        this._customerRepository = customerRepository;
    }


    async save(customer: CreateCustomerDto): Promise<Customer> {

        const isCustomerExist = await this._customerRepository.findByEmail(customer.email!);

        if (isCustomerExist)
            throw ErrorFactory.build(ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED, `email ${customer.email!} already exists`, '');

        return await this._customerRepository.save(customer);
    }

    async search(options: GetCustomerDto): Promise<IPaginationResponse<Customer[]>> {

        const [customers, totalItems] = await Promise.all([
            this._customerRepository.searchByFilters(options), this._customerRepository.getTotalRecords(options)
        ]);

        const page = options.page || 1;
        const limit = 20;
        const totalPages = Math.ceil(totalItems / limit);
        // 4. CÁLCULO DE NEXT Y PREVIOUS (Tu ajuste clave)
        const prevPage = page! > 1 ? page! - 1 : null;
        const nextPage = page! < totalPages ? page! + 1 : null;


        const response: IPaginationResponse<Customer[]> = {

            data: customers,
            paginationData: {
                page: +page,
                pageSize: customers.length,
                totalPages,
                totalRecords: totalItems,
                previousPage: prevPage!,
                nextPage: nextPage!
            }
        }

        return response;
    }

}