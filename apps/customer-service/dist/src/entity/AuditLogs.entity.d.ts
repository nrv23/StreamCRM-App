export declare class AuditLogs {
    readonly id: number;
    entity_type: string;
    entity_id: number;
    action: string;
    changed_by_user_id: number;
    readonly old_values: JSON;
    readonly new_values: JSON;
    created_at: string;
    constructor(id: number, // autogenerado
    entity_type: string, entity_id: number, action: string, changed_by_user_id: number, old_values: JSON, new_values: JSON, created_at: string);
}
//# sourceMappingURL=AuditLogs.entity.d.ts.map