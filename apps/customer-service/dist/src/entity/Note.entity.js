export class Note {
    id;
    note;
    customer_id;
    user_id;
    created_at;
    constructor(id, note, customer_id, user_id, created_at) {
        this.id = id;
        this.note = note;
        this.customer_id = customer_id;
        this.user_id = user_id;
        this.created_at = created_at;
    }
}
//# sourceMappingURL=Note.entity.js.map