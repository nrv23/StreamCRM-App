import { databaseInstance } from "../../config/query.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";
export class CustomerStatusHistoryRepository {
    _db;
    constructor(db) {
        this._db = db ?? databaseInstance;
    }
    async save(dto) {
        const [customerHistoryStatusResponse] = await this._db.query(`
            insert into customer_status_history(            
             customer_id,
             previous_status,
             new_status,
             changed_by_user_id
            )    
            values($1,$2,$3,$4)
            RETURNING *;
        `, [dto.customer_id, dto.previous_status, dto.new_status, dto.changed_by_userId]);
        if (!customerHistoryStatusResponse)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "customer status history record was not inserted");
        return customerHistoryStatusResponse;
    }
}
//# sourceMappingURL=customer-status-history-repository.repository.js.map