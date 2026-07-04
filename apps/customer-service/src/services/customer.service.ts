import { Customer } from "../entity/customer.entity.js";
import { ICustomerRepository } from "../interfaces/customer-repository.interface.js";
import { CreateCustomerDto } from './../dto/createCustomer.dto.js'


export class CustomerService {

    private _customerRepository: ICustomerRepository;

    constructor(customerRepository: ICustomerRepository) {
        this._customerRepository = customerRepository;
    }


    async save(customer: CreateCustomerDto): Promise<Customer> {

        const newcustomer = await this._customerRepository.save(customer);
        return newcustomer;
    }

}