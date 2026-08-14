import { CustomerRepository } from '../repository/customer/customer-repository.repository.js';
import { OutboxEventRepository } from '../repository/customer/outbox_event-repository.repository.js';
import { TagRepository } from '../repository/tag/tag.repository.js';
import { NoteRepository } from '../repository/note/note.repository.js';
import { CustomerStatusHistoryRepository } from '../repository/customer/customer-status-history-repository.repository.js';
import { AuditLogsRepository } from '../repository/auditLog/audit-log-repository.repository.js';
export interface IUnitOfWorkRepositories {
    customers: CustomerRepository;
    events: OutboxEventRepository;
    tags: TagRepository;
    notes: NoteRepository;
    customerStatusHistory: CustomerStatusHistoryRepository;
    auditLogs: AuditLogsRepository;
}
export declare class UnitOfWork {
    private getRepos;
    /**
     * Ejecuta una serie de operaciones dentro de una transacción segura.
     * Mantiene las referencias de conexión locales para evitar race conditions.
     */
    execute<T>(work: (repos: IUnitOfWorkRepositories) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=unitOfWork.d.ts.map