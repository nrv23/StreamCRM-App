
import type { SignOptions } from 'jsonwebtoken';

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
    rabbitmq_user: string;
    rabbitmq_password: string;
    rabbitmq_vhost: string;
    elastic_search_url: string;
    index_elastic_search_name: string;
    redis: {
        redis_host: string;
        redis_port: number;
        redis_username: string;
        redis_password: string;
        redis_max_retries_per_request: number;

    },
    hash_password_secret_key: string;
    access_token_ttl: NonNullable<SignOptions['expiresIn']>;
    refresh_token_ttl_days: number;
    session_ttl_days: number;
    jwt_secret: string;
}

