import dotenv from "dotenv";
import { IEnvConfig } from "../interfaces/IEnvConfig.js";
import { bool, cleanEnv, num, str } from 'envalid';

dotenv.config();

const validatedEnv = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ["dev", "production", "test"],
        default: "dev",
    }),
    DB_HOST: str(),
    DB_PORT: num({ default: 5433 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASSWORD: str(),

    API_VERSION: num({ default: 1 }),
    SERVER_PORT: num({}),

    SERVICE_NAME: str(),
    INTERVAL_WORKER_EXECUTION_TIME: num(),
    PAGINATION_RECORD_EVENTS_LIMIT: num(),
    PAGINATION_RECORD_PENDING_NOTIFICATION_DELIVERIES: num(),
    RABBITMQ_HOST: str({
        default: "localhost"
    }),
    RABBITMQ_HOST_PORT: num({
        default: 5673
    }),
    RABBITMQ_USER: str(),
    RABBITMQ_PASSWORD: str(),
    RABBITMQ_VHOST: str({ default: '/' }),
    //datos de cliente para conexion a servidor de envio de correos
    SMTP_HOST: str({ default: 'smtp.gmail.com' }),
    SMTP_PORT: num({ default: 587 }),
    SMTP_SECURE: bool({ default: false }),
    SMTP_USER: str({ default: '' }),
    SMTP_PASS: str({ default: '' }),
    SMTP_FROM: str({ default: '' }),
    SMS_API_KEY: str(),
    SMS_API_SECRET: str(),
    ELASTIC_SEARCH_URL: str({
        default: 'http://localhost:9200'
    }),
    INDEX_ELASTIC_SEARCH_NAME: str(),
    REDIS_HOST: str({
        default: "localhost"
    }),
    REDIS_PORT: num({
        default: 6379
    }),
    REDIS_PASSWORD: str({
        default: '12345'
    }),
    REDIS_USERNAME: str(),
    REDIS_MAX_RETRIES_PER_REQUEST: num()
});

export const env: IEnvConfig = {
    db: {
        host: validatedEnv.DB_HOST,
        port: validatedEnv.DB_PORT,
        database: validatedEnv.DB_NAME,
        user: validatedEnv.DB_USER,
        password: validatedEnv.DB_PASSWORD,
    },

    api_version: validatedEnv.API_VERSION,
    server_port: validatedEnv.SERVER_PORT,
    service_name: validatedEnv.SERVICE_NAME,
    interval_worker_execution_time: validatedEnv.INTERVAL_WORKER_EXECUTION_TIME,
    pagination_record_events_limit: validatedEnv.PAGINATION_RECORD_EVENTS_LIMIT,
    pagination_record_notification_deliveries: validatedEnv.PAGINATION_RECORD_PENDING_NOTIFICATION_DELIVERIES,
    rabbitmq_host: validatedEnv.RABBITMQ_HOST,
    rabbitmq_host_port: validatedEnv.RABBITMQ_HOST_PORT,
    rabbitmq_user: validatedEnv.RABBITMQ_USER,
    rabbitmq_password: validatedEnv.RABBITMQ_PASSWORD,
    rabbitmq_vhost: validatedEnv.RABBITMQ_VHOST,

    nodemailer: {
        host: validatedEnv.SMTP_HOST,
        port: validatedEnv.SMTP_PORT,
        secure: validatedEnv.SMTP_SECURE,
        auth: {
            user: validatedEnv.SMTP_USER,
            pass: validatedEnv.SMTP_PASS,
        },
        from: validatedEnv.SMTP_FROM,
    },
    sms: {
        api_key: validatedEnv.SMS_API_KEY,
        api_secret: validatedEnv.SMS_API_SECRET
    },
    elastic_search_url: validatedEnv.ELASTIC_SEARCH_URL,
    index_elastic_search_name: validatedEnv.INDEX_ELASTIC_SEARCH_NAME,
    redis: {
        redis_host: validatedEnv.REDIS_HOST,
        redis_port: validatedEnv.REDIS_PORT,
        redis_username: validatedEnv.REDIS_USERNAME,
        redis_password: validatedEnv.REDIS_PASSWORD,
        redis_max_retries_per_request: validatedEnv.REDIS_MAX_RETRIES_PER_REQUEST
    }
};