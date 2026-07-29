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
    RABBITMQ_HOST: str({
        default: "localhost"
    }),
    RABBITMQ_HOST_PORT: num({
        default: 5673
    }),
    RABBITMQ_USER: str(),
    RABBITMQ_PASSWORD: str(),
    RABBITMQ_VHOST: str({ default: '/' }),

    SMTP_HOST: str({ default: 'smtp.gmail.com' }),
    SMTP_PORT: num({ default: 587 }),
    SMTP_SECURE: bool({ default: false }),
    SMTP_USER: str({ default: '' }),
    SMTP_PASS: str({ default: '' }),
    SMTP_FROM: str({ default: '' }),
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
    }
};
