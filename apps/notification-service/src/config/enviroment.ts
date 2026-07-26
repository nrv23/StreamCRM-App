import dotenv from "dotenv";
import { IEnvConfig } from "../interfaces/IEnvConfig.js";
import { cleanEnv, num, str } from 'envalid';

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
    SERVER_PORT: num({ default: 3000 }),

    SERVICE_NAME: str(),
    INTERVAL_WORKER_EXECUTION_TIME: num(),
    PAGINATION_RECORD_EVENTS_LIMIT: num(),
    RABBITMQ_HOST: str({
        default: "localhost"
    }),
    RABBITMQ_HOST_PORT: num({
        default: 5672
    })
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
    rabbitmq_host_port: validatedEnv.RABBITMQ_HOST_PORT
};
/*
export const env: IEnvConfig = {
    db: {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT!),
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
    api_version: Number(process.env.API_VERSION) || 1,
    server_port: Number(process.env.PORT!),
    service_name: process.env.SERVICE_NAME!
};*/