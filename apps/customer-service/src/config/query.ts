// src/config/query.ts
// Wrapper around the pg Pool that implements the IDatabase interface.
// Also exports a singleton instance (`databaseInstance`) that can be shared
// across the application to avoid creating multiple wrapper objects.


import type { QueryResultRow } from "pg";
import { pool } from "./db.js";
import { IDatabase } from "../interfaces/customer/database.interface.js";

export class Database implements IDatabase {
    async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T[]> {
        const client = await pool.connect();
        console.log("Nueva conexion....");
        console.log({
            client: typeof client
        })
        /**
         * Ejecuta una consulta tipada contra PostgreSQL usando el pool
         * compartido. El pool mantiene sus propias conexiones y se re‑usa
         * internamente, por lo que no hay sobrecarga de crear nuevas
         * conexiones en cada request.
         */

        // revisar porque el debugger no funciona y ver logs de la clase database para ver que el pool funcione bien
        try {
            const result = await client.query<T>(text, params);
            return result.rows;
        } finally {
            client.release();
            console.log("Conexion liberada")
        }
    }
}


// Instancia única que pueden usar los repositorios que no inyecten su propio DB.
export const databaseInstance = new Database();