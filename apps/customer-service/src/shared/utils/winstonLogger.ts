

import winston, { Logger } from "winston";
import {
    ElasticsearchTransformer,
    ElasticsearchTransport,
    LogData,
    TransformedData
} from "winston-elasticsearch";

const esTransformer = (logData: LogData): TransformedData => {

    return ElasticsearchTransformer(logData)
}
export const winstonLogger = (
    elasticSearchNode: string,
    service: string,
    level: string,
    indexPrefix: string
): Logger => {

    const esTransport = new ElasticsearchTransport({
        level,
        indexPrefix,
        transformer: esTransformer,

        clientOpts: {
            node: elasticSearchNode,
            maxRetries: 2,
            requestTimeout: 10000,
            sniffOnStart: false
        }
    });

    esTransport.on('error', (error) => {
        console.error('[ELASTIC TRANSPORT ERROR]', error);
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
};