import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../config/unitOfWork.js';
import { CreateTagDto } from '../dto/tag/create-tag.dto.js';
import { ApiErrorCode } from '../enum/error-codes.enum.js';
import { ErrorFactory } from '../shared/factory/error-factory.js';
import { CREATE_TAG } from '../shared/types/events.type.js';
import { env } from '../config/enviroment.js';
import { EntityType } from '../enum/entity-type.enum.js';
import { CustomerResponseCode } from '../responses/customer.responses.js';


export class TagService {

    private _unitOfWork: UnitOfWork;

    constructor(unitOfWork: UnitOfWork) {
        this._unitOfWork = unitOfWork;
    }

    async save(dto: CreateTagDto) {

        return await this._unitOfWork.execute(async ({ tags, customers, events, auditLogs }) => {

            const customer = await customers.findById(dto.customerId);
            if (!customer) throw ErrorFactory.build(
                ApiErrorCode.NOT_FOUND,
                CustomerResponseCode[ApiErrorCode.NOT_FOUND]!.message
            );

            const newTag = await tags.save(dto);
            // agregar a la tabla customer_tags y outbox events

            //const addedTagToCustomer = 

            /*if (!addedTagToCustomer)
                throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'An error occurred while trying to insert the tag ', '');
            */

            await Promise.all([
                tags.addTagToCustomer(customer.id, newTag.id),
                events.save({
                    event_id: randomUUID(),
                    event_name: CREATE_TAG,
                    aggregate_id: customer.id,
                    aggregate_type: EntityType.CUSTOMER_TAG,
                    payload: {
                        customerId: customer.id,
                        tagId: newTag.id,
                        created_at: new Date().toISOString()
                    },
                    headers: {
                        source: env.service_name,
                        version: env.api_version,
                    }
                }),
                auditLogs.save({
                    entity_id: newTag.id,
                    entity_type: EntityType.CUSTOMER_TAG,
                    action: CREATE_TAG,
                    changed_by_user_id: dto.user_id,
                    old_values: {},
                    new_values: { ...newTag },
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent
                })
            ]);

            return newTag;
        });
    }
}