import { databaseInstance } from "../../config/query.js";
import { ChangeCustomerHistoryStatusDto } from "../../dto/customer/changeCustomerStatusHistory,dto.js";
import { CustomerStatusHistory } from "../../entity/CustomerStatusHistory.entity.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { ICustomerStatusHistoryRepository } from "../../interfaces/customer/customer-status-history-repository.interface.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";

export class CustomerStatusHistoryRepository implements ICustomerStatusHistoryRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }


    async save(dto: ChangeCustomerHistoryStatusDto): Promise<CustomerStatusHistory> {

        const [customerHistoryStatusResponse] = await this._db.query<CustomerStatusHistory>(`
            insert into customer_status_history(            
             customer_id,
             previous_status,
             new_status,
             changed_by_user_id
            )    
            values($1,$2,$3,$4)
            RETURNING *;
        `, [dto.customer_id, dto.previous_status, dto.new_status, dto.changed_by_userId]);

        if (!customerHistoryStatusResponse) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "customer status history record was not inserted",
            "",
        );
        return customerHistoryStatusResponse;

    }
}