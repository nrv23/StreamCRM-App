import { CreateLogDto } from "../../dto/auditLog/create-log.dto.js";
import { AuditLogs } from "../../entity/AuditLogs.entity.js";

export interface IAuditLogsRepository {
    save(log: CreateLogDto): Promise<AuditLogs>;
}