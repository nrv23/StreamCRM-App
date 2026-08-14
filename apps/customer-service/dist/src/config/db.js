import { Pool } from "pg";
import { env } from "./enviroment.js";
import { WinstonLogger } from "../shared/utils/winstonLogger.js";
export const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 60_000,
});
const logger = WinstonLogger.getInstance(env.elastic_search_url, 'config-db-module', 'debug', env.index_elastic_search_name);
pool.on("connect", async (client) => {
    await client.query(`SET TIME ZONE 'America/Costa_Rica';`);
    const log = {
        service: env.service_name,
        event: "db-module"
    };
    logger.info("PostgreSQL pool connected", log);
});
pool.on("error", (err) => {
    let errorObject = {
        message: '',
        stack: '',
        name: ''
    };
    if (err instanceof Error) {
        errorObject = {
            stack: err.stack?.toString(),
            message: err.message,
            name: err.name
        };
    }
    else {
        errorObject.message = String(err);
    }
    const log = {
        service: env.service_name,
        error_message: errorObject.message,
        error_name: errorObject.name,
        error_stack: errorObject.stack,
        event: "db-module"
    };
    logger.info("Unexpected PostgreSQL pool error:", log);
});
//# sourceMappingURL=db.js.map