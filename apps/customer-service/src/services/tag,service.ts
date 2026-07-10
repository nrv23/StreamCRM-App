import { UnitOfWork } from '../config/unitOfWork.js';
import { CreateTagDto } from '../dto/tag/create-tag.dto.js';
import { ApiErrorCode } from '../enum/error-codes.enum.js';
import { ErrorFactory } from '../shared/factory/error-factory.js';



export class TagService {

    private _unitOfWork: UnitOfWork;

    constructor(unitOfWork: UnitOfWork) {
        this._unitOfWork = unitOfWork;
    }

    async save(tagDto: CreateTagDto) {

        return await this._unitOfWork.execute(async ({ tags, customers }) => {

            const customer = await customers.findById(tagDto.customerId);
            if (!customer) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, `Customer is not exists`, '');

            const newTag = await tags.save(tagDto);
            // agregar a la tabla customer_tags y outbox events
            return newTag;

            /* await events.save({
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
                     source: "customer-service",
                     version: env.api_version,
                 }
             });*/
        });

    }

}