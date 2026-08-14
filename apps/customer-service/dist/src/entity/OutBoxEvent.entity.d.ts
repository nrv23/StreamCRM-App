export declare class OutBoxEvent {
    readonly id: number;
    event_id: string;
    event_name: string;
    aggregate_id: string;
    aggregate_type: string;
    payload: JSON;
    headers: JSON;
    status: string;
    retry_count: number;
    error_message: string;
    created_at: string;
    published_at: string;
    constructor(id: number, event_id: string, event_name: string, aggregate_id: string, aggregate_type: string, payload: JSON, headers: JSON, status: string, // crear un enum
    retry_count: number, // crear un enum
    error_message: string, // crear un enum
    created_at: string, // crear un enum
    published_at: string);
}
//# sourceMappingURL=OutBoxEvent.entity.d.ts.map