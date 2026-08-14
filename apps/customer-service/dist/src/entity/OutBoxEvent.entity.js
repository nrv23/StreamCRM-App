export class OutBoxEvent {
    id;
    event_id;
    event_name;
    aggregate_id;
    aggregate_type;
    payload;
    headers;
    status;
    retry_count;
    error_message;
    created_at;
    published_at;
    constructor(id, event_id, event_name, aggregate_id, aggregate_type, payload, headers, status, // crear un enum
    retry_count, // crear un enum
    error_message, // crear un enum
    created_at, // crear un enum
    published_at) {
        this.id = id;
        this.event_id = event_id;
        this.event_name = event_name;
        this.aggregate_id = aggregate_id;
        this.aggregate_type = aggregate_type;
        this.payload = payload;
        this.headers = headers;
        this.status = status;
        this.retry_count = retry_count;
        this.error_message = error_message;
        this.created_at = created_at;
        this.published_at = published_at;
    }
}
//# sourceMappingURL=OutBoxEvent.entity.js.map