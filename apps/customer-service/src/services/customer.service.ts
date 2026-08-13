import { randomUUID } from "node:crypto";
import { UnitOfWork } from "../config/unitOfWork.js";
import { GetCustomerDto } from "../dto/customer/getCustomer.dto.js";
import { UpdateCustomerDto } from "../dto/customer/updateCustomer.dto.js";
import { Customer } from "../entity/Customer.entity.js";
import { CustomerStatus } from "../enum/CustomerStatus.enum.js";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.js";
import { ICustomerRepository } from "../interfaces/customer/customer-repository.interface.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";
import { CreateCustomerDto } from '../dto/customer/createCustomer.dto.js'
import { env } from "../config/enviroment.js";
import { CREATE_CUSTOMER, CHANGE_CUSTOMER_STATUS, UPDATE_CUSTOMER, DELETE_CUSTOMER } from "../shared/types/events.type.js";
import { EntityType } from "../enum/EntityType.enum.js";
import { Logger } from "winston";
import { ILogMetadata } from "../interfaces/iLog.interface.ts";

export class CustomerService {

    private _unitOfWork: UnitOfWork
    private _customerRepository: ICustomerRepository;
    private _logger: Logger;

    constructor(customerRepository: ICustomerRepository, unitOfWork: UnitOfWork, logger: Logger) {
        this._customerRepository = customerRepository;
        this._unitOfWork = unitOfWork;
        this._logger = logger;
    }


    async save(dto: CreateCustomerDto): Promise<Customer> {

        return await this._unitOfWork.execute(async ({ customers, events, auditLogs }) => {

            const currentCustomer = await customers.findByEmail(dto.email!);

            if (currentCustomer) throw ErrorFactory.build(ApiErrorCode.CUSTOMER_EMAIL_DUPLICATED);

            const customer = await customers.save(dto);

            // Promise all para ejecutar eventos y logs de auditoria
            const event_id = randomUUID();
            await Promise.all([
                events.save({
                    event_id,
                    event_name: CREATE_CUSTOMER,
                    aggregate_id: customer.id,
                    aggregate_type: EntityType.CUSTOMER,
                    payload: {
                        customerId: customer.id,
                        firstName: customer.first_name,
                        lastName: customer.last_name,
                        email: customer.email,
                        phone: customer.phone,
                        country: customer.country,
                        user_id: dto.user_id
                    },

                    headers: {
                        source: env.service_name,
                        version: env.api_version,
                    }
                }),
                auditLogs.save({
                    entity_id: customer.id,
                    entity_type: EntityType.CUSTOMER,
                    action: CREATE_CUSTOMER,
                    changed_by_user_id: dto.user_id,
                    old_values: {},
                    new_values: { ...customer },
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent
                })
            ]);

            const log: ILogMetadata = {
                service: env.service_name,
                event: CREATE_CUSTOMER,
                entity_id: customer.id,
                method: 'POST',
                route: 'api/v1/customers',
                status_code: 201,
                event_id
            };

            this._logger.info('customer created', log);
            return customer;
        });
    }

    async search(options: GetCustomerDto): Promise<IPaginationResponse<Customer[]>> {


        const page = options.page || 1;
        const limit = options.limit || 20;

        options.limit = limit;
        options.page = page;
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

    async update(dto: UpdateCustomerDto): Promise<Customer> {


        return await this._unitOfWork.execute(async ({ customers, events, auditLogs }) => {

            const currentCustomer = await customers.findById(dto.id);

            if (!currentCustomer)
                throw ErrorFactory.build(ApiErrorCode.NOT_FOUND);


            const customer = await customers.update(dto);
            const event_id = randomUUID();
            await Promise.all([
                events.save({
                    event_id,
                    event_name: UPDATE_CUSTOMER,
                    aggregate_id: customer.id,
                    aggregate_type: EntityType.CUSTOMER,
                    payload: {
                        customerId: customer.id,
                        firstName: customer.first_name,
                        lastName: customer.last_name,
                        email: customer.email,
                        phone: customer.phone,
                        country: customer.country,
                        user_id: dto.user_id
                    },

                    headers: {
                        source: env.service_name,
                        version: env.api_version,
                    }
                }),
                auditLogs.save({
                    entity_id: customer.id,
                    entity_type: EntityType.CUSTOMER,
                    action: UPDATE_CUSTOMER,
                    changed_by_user_id: dto.user_id,
                    old_values: { ...currentCustomer },
                    new_values: { ...customer },
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent
                })
            ]);

            const log: ILogMetadata = {
                service: env.service_name,
                event: UPDATE_CUSTOMER,
                event_id,
                entity_id: customer.id,
                method: 'PUT',
                route: `api/v1/customers/${customer.id}`,
                status_code: 200
            };

            this._logger.info('customer updated', log);

            return customer;
        });
    }
    async setStatus(
        customer_id: number,
        status: CustomerStatus,
        user_id: number,
        ip_address: string,
        user_agent: string
    ): Promise<Customer> {
        return this._unitOfWork.execute(
            async ({ customers, events, customerStatusHistory, auditLogs }) => {
                const currentCustomer = await customers.findById(customer_id);

                if (!currentCustomer) {
                    throw ErrorFactory.build(ApiErrorCode.NOT_FOUND);
                }

                if (currentCustomer.status === status) {
                    throw ErrorFactory.build(
                        ApiErrorCode.CONFLICT_ERROR,
                        `Customer already has status '${status}'`,
                    );
                }

                const updatedCustomer = await customers.setStatus(customer_id, status);
                const event_id = randomUUID();


                await Promise.all([
                    customerStatusHistory.save({
                        customer_id: updatedCustomer.id,
                        previous_status: currentCustomer.status,
                        new_status: status,
                        changed_by_userId: user_id,
                    }),

                    events.save({
                        event_id,
                        event_name:
                            status === CustomerStatus.blocked
                                ? DELETE_CUSTOMER
                                : CHANGE_CUSTOMER_STATUS,

                        aggregate_id: updatedCustomer.id,
                        aggregate_type: EntityType.CUSTOMER,

                        payload: {
                            customerId: updatedCustomer.id,
                            firstName: updatedCustomer.first_name,
                            lastName: updatedCustomer.last_name,
                            email: updatedCustomer.email,
                            phone: updatedCustomer.phone,
                            country: updatedCustomer.country,
                            previousStatus: currentCustomer.status,
                            newStatus: status,
                            user_id
                        },

                        headers: {
                            source: env.service_name,
                            version: env.api_version,
                        },
                    }),
                    auditLogs.save({
                        entity_id: updatedCustomer.id,
                        entity_type: EntityType.CUSTOMER,
                        action: status === CustomerStatus.blocked ? DELETE_CUSTOMER : CHANGE_CUSTOMER_STATUS,
                        changed_by_user_id: user_id,
                        old_values: {
                            status: currentCustomer.status
                        },
                        new_values: {
                            status
                        },
                        ip_address,
                        user_agent
                    })
                ]);

                const log: ILogMetadata = {
                    service: env.service_name,
                    event: CHANGE_CUSTOMER_STATUS,
                    event_id,
                    entity_id: updatedCustomer.id,
                    method: 'PATCH',
                    route: `api/v1/customers/status/${updatedCustomer.id}`,
                    status_code: 200
                };

                this._logger.info('customer status updated', log);

                return updatedCustomer;
            },
        );
    }

    async searchById(id: number) {

        const customer = await this._customerRepository.findById(id);
        if (!customer)
            throw ErrorFactory.build(ApiErrorCode.NOT_FOUND);
        return customer;
    }
}