import type { QueryResultRow } from "pg";
import { pool } from "./db.js";

export class Database {
    async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T[]> {
        const result = await pool.query<T>(text, params);
        return result.rows;
    }

}