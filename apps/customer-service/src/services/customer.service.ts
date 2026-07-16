import { randomUUID } from "node:crypto";
import { UnitOfWork } from "../config/unitOfWork.js";
import { GetCustomerDto } from "../dto/customer/getCustomer.dto.js";
import { UpdateCustomerDto } from "../dto/customer/updateCustomer.dto.js";
import { Customer } from "../entity/Customer.entity.js";
import { CustomerStatus } from "../enum/CustomerStatus.type.js";
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { ICustomerRepository } from "../interfaces/customer/customer-repository.interface.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";
import { CreateCustomerDto } from '../dto/customer/createCustomer.dto.js'
import { env } from "../config/enviroment.js";
import { CREATE_CUSTOMER, CHANGE_CUSTOMER_STATUS, UPDATE_CUSTOMER, DELETE_CUSTOMER } from "../shared/types/events.type.js";


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
                    source: env.service_name,
                    version: env.api_version,
                }
            });

            return customer;
        });
    }

    async search(options: GetCustomerDto): Promise<IPaginationResponse<Customer[]>> {


        const page = options.page || 1;
        const limit = options.limit || 20;

        // 4. CÁLCULO DE NEXT Y PREVIOUS (Tu ajuste clave)
        const [customers, totalItems] = await Promise.all([
            this._customerRepository.searchByFilters(options), this._customerRepository.getTotalRecords(options)
        ]);

        const totalPages = Math.ceil(totalItems / limit);
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

    async update(customerDto: UpdateCustomerDto): Promise<Customer> {


        return await this._unitOfWork.execute(async ({ customers, events }) => {

            await this.searchById(customerDto.id);

            const customer = await customers.update(customerDto);

            await events.save({
                event_id: randomUUID(),
                event_name: UPDATE_CUSTOMER,
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
                    source: env.service_name,
                    version: env.api_version,
                }
            });

            return customer;
        });
    }

    async setStatus(id: number, status: CustomerStatus, user_id: number) {

        return await this._unitOfWork.execute(async ({ customers, events, customerStatusHistory }) => {


            const isCustomerExist = await this.searchById(id);

            if (isCustomerExist.status === CustomerStatus.blocked && status === CustomerStatus.blocked)
                throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, `Customer is not exists`, '');

            const customer = await customers.setStatus(id, status);

            await events.save({
                event_id: randomUUID(),
                event_name: status === CustomerStatus.blocked
                    ? DELETE_CUSTOMER
                    : CHANGE_CUSTOMER_STATUS,
                aggregate_id: customer.id,
                aggregate_type: "customer",
                payload: {
                    customerId: customer.id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    country: customer.country,
                    status
                },

                headers: {
                    source: env.service_name,
                    version: env.api_version,
                }
            });

            // agregar aqui el registro en customer_status_history

            if (status !== isCustomerExist.status) await customerStatusHistory.save({
                customer_id: isCustomerExist.id,
                new_status: status,
                previous_status: isCustomerExist.status,
                changed_by_userId: user_id
            });

            return customer;
        });
    }

    async searchById(id: number) {

        const customer = await this._customerRepository.findById(id);
        if (!customer)
            throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, `customer is not exists`, '');
        return customer;
    }
}