import { CreateLogDto } from "../../dto/auditLog/create-log.dto.js";

export interface IAuditLogsRepository {
    save(log: CreateLogDto): Promise<void>;
}