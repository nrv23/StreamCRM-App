

export class AuditLogs {

    constructor(
        public readonly id: number, // autogenerado
        public entity_type: string,
        public entity_id: number,
        public action: string,
        public changed_by_user_id: number,
        public readonly old_values: JSON,
        public readonly new_values: JSON,
        public created_at: string // autogenerado
    ) {

    }
}