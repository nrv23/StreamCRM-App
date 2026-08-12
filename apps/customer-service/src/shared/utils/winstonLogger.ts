

import winston, { Logger } from "winston";
import {
    ElasticsearchTransformer,
    ElasticsearchTransport,
    LogData,
    TransformedData
} from "winston-elasticsearch";

export class WinstonLogger {

    private static _loggerInstance: Logger | null = null;

    private constructor() { }

    public static getInstance(
        elasticSearchNode: string,
        service: string,
        level: string,
        indexPrefix: string
    ): Logger {

        if (!WinstonLogger._loggerInstance) {
            WinstonLogger._loggerInstance = WinstonLogger.createLogger(
                elasticSearchNode,
                service,
                level,
                indexPrefix
            );
        }

        return WinstonLogger._loggerInstance;
    }

    private static esTransformer(
        logData: LogData
    ): TransformedData {

        return ElasticsearchTransformer(logData);
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
            transformer: WinstonLogger.esTransformer,

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

        return winston.createLogger({
            exitOnError: false,

            defaultMeta: {
                service
            },

            transports: [
                new winston.transports.Console({
                    level
                }),

                esTransport
            ]
        });
    }
}