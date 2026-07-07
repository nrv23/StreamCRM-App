import { randomUUID } from "node:crypto";
import { UnitOfWork } from "../config/unitOfWork.js";
import { GetCustomerDto } from "../dto/getCustomer.dto.js";
import { UpdateCustomerDto } from "../dto/updateCustomer.dto.js";
import { Customer } from "../entity/customer.entity.js";
import { CustomerStatus } from "../enum/CustomerStatus.type.js";
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { ICustomerRepository } from "../interfaces/customer-repository.interface.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";
import { CreateCustomerDto } from './../dto/createCustomer.dto.js'
import { env } from "../config/enviroment.js";
import { CREATE_CUSTOMER } from "../shared/types/events.type.js";


export class CustomerService {

    private _unitOfWork: UnitOfWork
    private _customerRepository: ICustomerRepository;

    constructor(customerRepository: ICustomerRepository, unitOfWork: UnitOfWork) {
        this._customerRepository = customerRepository;
        this._unitOfWork = unitOfWork;
    }


    async save(customerDto: CreateCustomerDto): Promise<Customer> {

        return await this._unitOfWork.execute(async ({ customers, events }) => {

            const isCustomerExist = await customers.findByEmail(customerDto.email!);

            if (isCustomerExist)
                throw ErrorFactory.build(ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED, `email ${customerDto.email!} already exists`, '');

            const customer = await customers.save(customerDto);

            await events.save({
                event_id: randomUUID(),
                event_name: CREATE_CUSTOMER,
                aggregate_id: customer.id,
                aggregate_type: "customer",
                payload: {
                    customerId: customer.id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    country: customer.country
                },

                headers: {
                    source: "customer-service",
                    version: env.api_version,
                }
            });

            return customer;
        });
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

    async update(customer: UpdateCustomerDto): Promise<Customer> {

        await this.searchById(customer.id);
        return await this._customerRepository.update(customer);
    }

    async delete(id: number, status: CustomerStatus) {

        await this.searchById(id);
        return await this._customerRepository.delete(id, status);
    }

    async searchById(id: number) {

        const customer = await this._customerRepository.findById(id);
        if (!customer)
            throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, `customer is not exists`, '');
        return customer;
    }
}