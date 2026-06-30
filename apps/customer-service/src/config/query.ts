import { QueryResult, QueryResultRow } from "pg";
import { pool } from "./pool.ts";


export class Database {

    static async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<QueryResult<T>> {
        return pool.query<T>(text, params);
    }
}

