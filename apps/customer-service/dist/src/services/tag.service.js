import { randomUUID } from 'node:crypto';
import { ApiErrorCode } from '../enum/ErrorCodes.enum.js';
import { ErrorFactory } from '../shared/factory/error-factory.js';
import { CREATE_TAG } from '../shared/types/events.type.js';
import { env } from '../config/enviroment.js';
import { EntityType } from '../enum/EntityType.enum.js';
export class TagService {
    _unitOfWork;
    _logger;
    constructor(unitOfWork, logger) {
        this._unitOfWork = unitOfWork;
        this._logger = logger;
    }
    async save(dto) {
        return await this._unitOfWork.execute(async ({ tags, customers, events, auditLogs }) => {
            const customer = await customers.findById(dto.customerId);
            if (!customer)
                throw ErrorFactory.build(ApiErrorCode.NOT_FOUND);
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
                        customer_id: customer.id,
                        tag_id: newTag.id,
                        created_at: newTag.created_at,
                        tag_name: dto.name,
                        user_id: dto.user_id
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
            const log = {
                service: env.service_name,
                event: CREATE_TAG,
                entity_id: newTag.id,
                method: 'POST',
                route: `api/v1/tags/${dto.customerId}`,
                status_code: 201
            };
            this._logger.info('Tag created', log);
            return newTag;
        });
    }
}
//# sourceMappingURL=tag.service.js.map