export class AuditLogs {
    id;
    entity_type;
    entity_id;
    action;
    changed_by_user_id;
    old_values;
    new_values;
    created_at;
    constructor(id, // autogenerado
    entity_type, entity_id, action, changed_by_user_id, old_values, new_values, created_at // autogenerado
    ) {
        this.id = id;
        this.entity_type = entity_type;
        this.entity_id = entity_id;
        this.action = action;
        this.changed_by_user_id = changed_by_user_id;
        this.old_values = old_values;
        this.new_values = new_values;
        this.created_at = created_at;
    }
}
//# sourceMappingURL=AuditLogs.entity.js.map