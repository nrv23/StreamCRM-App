import { CreateLogDto } from './../../dto/auditLog/create-log.dto.ts'
import { AuditLogs } from "../../entity/AuditLogs.entity.js";

export interface IAuditLogsRepository {
    save(log: CreateLogDto): Promise<AuditLogs>;
}