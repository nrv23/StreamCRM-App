// src/config/query.ts
// Wrapper around the pg Pool that implements the IDatabase interface.
// Also exports a singleton instance (`databaseInstance`) that can be shared
// across the application to avoid creating multiple wrapper objects.

import type { QueryResultRow } from "pg";
import { pool } from "./db.js";
import { IDatabase } from "../interfaces/database.interface.js";

export class Database implements IDatabase {
    /**
     * Ejecuta una consulta tipada contra PostgreSQL usando el pool
     * compartido. El pool mantiene sus propias conexiones y se re‑usa
     * internamente, por lo que no hay sobrecarga de crear nuevas
     * conexiones en cada request.
     */
    async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T[]> {
        const result = await pool.query<T>(text, params);
        return result.rows;
    }
}

// Instancia única que pueden usar los repositorios que no inyecten su propio DB.
export const databaseInstance = new Database();