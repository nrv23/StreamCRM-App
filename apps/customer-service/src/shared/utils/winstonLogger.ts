import winston, { Logger } from 'winston';

import {
    ElasticsearchTransformer,
    ElasticsearchTransport,
    LogData
} from 'winston-elasticsearch';

interface IElasticLogDocument {
    '@timestamp': string;
    level: string;
    message: string;

    service?: string;
    event?: string;
    event_id?: string;
    correlation_id?: string;
    request_id?: string;
    customer_id?: number;
    method?: string;
    route?: string;
    status_code?: number;
    error_name?: string;
    error_message?: string;
    error_stack?: string;

    [key: string]: unknown;
}

export class WinstonLogger {

    private static instance: Logger | null = null;

    private constructor() { }

    public static getInstance(
        elasticSearchNode: string,
        service: string,
        level: string,
        indexPrefix: string
    ): Logger {

        if (WinstonLogger.instance) {
            return WinstonLogger.instance;
        }

        WinstonLogger.instance = WinstonLogger.createLogger(
            elasticSearchNode,
            service,
            level,
            indexPrefix
        );

        return WinstonLogger.instance;
    }

    private static transform(
        logData: LogData
    ): IElasticLogDocument {
        const metadata = Object.fromEntries(
            Object.entries(logData.meta ?? {})
        );

        return {
            '@timestamp': logData.timestamp ?? new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            ...metadata
        };
    }

    private static createLogger(
        elasticSearchNode: string,
        service: string,
        level: string,
        indexPrefix: string
    ): Logger {

        const esTransport = new ElasticsearchTransport({
            level,
            indexPrefix,
            transformer: WinstonLogger.transform,

            clientOpts: {
                node: elasticSearchNode,
                maxRetries: 2,
                requestTimeout: 10000,
                sniffOnStart: false
            }
        });

        esTransport.on('error', (error) => {
            console.error(
                '[ELASTIC TRANSPORT ERROR]',
                error
            );
        });

        esTransport.on('error', (error) => {
            console.error('[ELASTIC TRANSPORT ERROR]', error);
        });

        esTransport.on('warning', (warning) => {
            console.warn('[ELASTIC TRANSPORT WARNING]', warning);
        });

        return winston.createLogger({
            level,
            exitOnError: false,

            defaultMeta: {
                service
            },

            transports: [
                new winston.transports.Console(),
                esTransport
            ]
        });
    }
}