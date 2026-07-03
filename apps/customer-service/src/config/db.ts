import { Pool } from "pg";
import { env } from "./enviroment.js";

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

pool.on("connect", async client => {
    await client.query(`SET TIME ZONE 'America/Costa_Rica';`);
    console.log("PostgreSQL pool connected");
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
});