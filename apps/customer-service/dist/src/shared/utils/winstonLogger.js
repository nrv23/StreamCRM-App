import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
export class WinstonLogger {
    static instance = null;
    constructor() { }
    static getInstance(elasticSearchNode, service, level, indexPrefix) {
        if (WinstonLogger.instance) {
            return WinstonLogger.instance;
        }
        WinstonLogger.instance = WinstonLogger.createLogger(elasticSearchNode, service, level, indexPrefix);
        return WinstonLogger.instance;
    }
    static transform(
    // este metodo convierte los logs a la estructura custome 
    logData) {
        const metadata = Object.fromEntries(Object.entries(logData.meta ?? {}));
        return {
            '@timestamp': logData.timestamp ?? new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            ...metadata
        };
    }
    static createLogger(elasticSearchNode, service, level, indexPrefix) {
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
            console.error('[ELASTIC TRANSPORT ERROR]', error);
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
//# sourceMappingURL=winstonLogger.js.map