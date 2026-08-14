import { CreateLogDto } from "../../dto/auditLog/create-log.dto.js";
import { AuditLogs } from "../../entity/AuditLogs.entity.js";
import { IAuditLogsRepository } from "../../interfaces/auditLog/audit-log-repository.interface.js";
import { IDatabase } from "../../interfaces/database.interface.js";
export declare class AuditLogsRepository implements IAuditLogsRepository {
    private _db;
    constructor(db?: IDatabase);
    save(log: CreateLogDto): Promise<AuditLogs>;
}
//# sourceMappingURL=audit-log-repository.repository.d.ts.map