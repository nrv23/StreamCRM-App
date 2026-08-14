import { ChangeCustomerHistoryStatusDto } from "../../dto/customer/changeCustomerStatusHistory,dto.js";
import { CustomerStatusHistory } from "../../entity/CustomerStatusHistory.entity.js";
import { ICustomerStatusHistoryRepository } from "../../interfaces/customer/customer-status-history-repository.interface.js";
import { IDatabase } from "../../interfaces/database.interface.js";
export declare class CustomerStatusHistoryRepository implements ICustomerStatusHistoryRepository {
    private _db;
    constructor(db?: IDatabase);
    save(dto: ChangeCustomerHistoryStatusDto): Promise<CustomerStatusHistory>;
}
//# sourceMappingURL=customer-status-history-repository.repository.d.ts.map