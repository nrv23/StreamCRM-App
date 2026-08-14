export class CustomerStatusHistory {
    id;
    customer_id;
    previous_status;
    new_status;
    changed_by_user_id;
    created_at;
    constructor(id, customer_id, previous_status, new_status, changed_by_user_id, created_at) {
        this.id = id;
        this.customer_id = customer_id;
        this.previous_status = previous_status;
        this.new_status = new_status;
        this.changed_by_user_id = changed_by_user_id;
        this.created_at = created_at;
    }
}
//# sourceMappingURL=CustomerStatusHistory.entity.js.map