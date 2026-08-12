export interface ILogMetadata {
    service: string;
    event?: string;
    event_id?: string;
    correlation_id?: string;
    request_id?: string;
    customer_id?: number;
    method?: string;
    route?: string;
    status_code?: number;
    error?: {
        name?: string;
        message: string;
        stack?: string;
    };
    timestamp: string
}