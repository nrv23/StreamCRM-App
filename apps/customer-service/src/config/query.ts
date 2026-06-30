import type { QueryResultRow } from "pg";
import { pool } from "./pool.js";

export class Database {
    static async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T[]> {
        const result = await pool.query<T>(text, params);
        return result.rows;
    }
}