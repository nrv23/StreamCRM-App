import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../config/unitOfWork.js';
import { CreateTagDto } from '../dto/tag/create-tag.dto.js';
import { ApiErrorCode } from '../enum/error-codes.enum.js';
import { ErrorFactory } from '../shared/factory/error-factory.js';
import { CREATE_TAG } from '../shared/types/events.type.js';
import { env } from '../config/enviroment.js';


export class TagService {

    private _unitOfWork: UnitOfWork;

    constructor(unitOfWork: UnitOfWork) {
        this._unitOfWork = unitOfWork;
    }

    async save(tagDto: CreateTagDto) {

        return await this._unitOfWork.execute(async ({ tags, customers, events }) => {

            const customer = await customers.findById(tagDto.customerId);
            if (!customer) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, `Customer is not exists`, '');

            const newTag = await tags.save(tagDto);
            // agregar a la tabla customer_tags y outbox events

            const addedTagToCustomer = await tags.addTagToCustomer(customer.id, newTag.id);

            if (!addedTagToCustomer)
                throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'An error occurred while trying to insert the tag ', '');

            await events.save({
                event_id: randomUUID(),
                event_name: CREATE_TAG,
                aggregate_id: customer.id,
                aggregate_type: "customer",
                payload: {
                    customerId: customer.id,
                    tagId: newTag.id,
                    created_at: new Date().toISOString()
                },
                headers: {
                    source: "customer-service",
                    version: env.api_version,
                }
            });

            return newTag;
        });
    }
}