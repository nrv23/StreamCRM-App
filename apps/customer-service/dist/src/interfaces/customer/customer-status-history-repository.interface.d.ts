import { ChangeCustomerHistoryStatusDto } from "../../dto/customer/changeCustomerStatusHistory,dto.js";
import { CustomerStatusHistory } from "../../entity/CustomerStatusHistory.entity.js";
export interface ICustomerStatusHistoryRepository {
    save(dto: ChangeCustomerHistoryStatusDto): Promise<CustomerStatusHistory>;
}
//# sourceMappingURL=customer-status-history-repository.interface.d.ts.map