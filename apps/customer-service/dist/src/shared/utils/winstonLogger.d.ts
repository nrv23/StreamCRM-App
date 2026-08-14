import { Logger } from 'winston';
export declare class WinstonLogger {
    private static instance;
    private constructor();
    static getInstance(elasticSearchNode: string, service: string, level: string, indexPrefix: string): Logger;
    private static transform;
    private static createLogger;
}
//# sourceMappingURL=winstonLogger.d.ts.map