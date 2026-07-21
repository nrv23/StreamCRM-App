import { databaseInstance } from "../../config/query.js";
import { CreateLogDto } from "../../dto/auditLog/create-log.dto.js";
import { AuditLogs } from "../../entity/AuditLogs.entity.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { IAuditLogsRepository } from "../../interfaces/AuditLog/audit-log-repository.interface.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";


export class AuditLogsRepository implements IAuditLogsRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    /*

     acciones que requieren guardar logs de auditoria 
        customer.created
        customer.updated
        customer.status.changed
        customer.tag.added
        customer.tag.removed
        customer.note.created
        customer.note.deleted
     */
    async save(log: CreateLogDto): Promise<AuditLogs> {
        const query = `
            INSERT INTO audit_logs (
                entity_type,
                entity_id,
                action,
                changed_by_user_id,
                old_values,
                new_values,
                ip_address, 
                user_agent
            )
            VALUES (
                $1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8
            )
            RETURNING * ;
        `;

        const [response] = await this._db.query<AuditLogs>(query, [
            log.entity_type,
            log.entity_id,
            log.action,
            log.changed_by_user_id,
            log.old_values,
            log.new_values,
            log.ip_address,
            log.user_agent
        ]);

        if (!response) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "log was not inserted",
            "",
        );

        return response;
    }
}