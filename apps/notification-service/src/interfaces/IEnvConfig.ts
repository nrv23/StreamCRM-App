

export interface IEnvConfig {
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    },
    api_version: number,
    server_port: number,
    service_name: string,
    interval_worker_execution_time: number;
    pagination_record_events_limit: number;
    rabbitmq_host: string;
    rabbitmq_host_port: number;
}