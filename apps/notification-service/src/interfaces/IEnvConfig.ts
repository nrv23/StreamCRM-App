

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
    pagination_record_notification_deliveries: number;
    rabbitmq_host: string;
    rabbitmq_host_port: number;
    rabbitmq_user: string;
    rabbitmq_password: string;
    rabbitmq_vhost: string;
    nodemailer: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        from: string;
    };
    sms: {
        api_key: string;
        api_secret: string;
    },
    elastic_search_url: string;
    index_elastic_search_name: string;
}