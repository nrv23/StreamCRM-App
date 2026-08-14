import type { QueryResultRow } from "pg";
export interface IDatabase {
    /**
     * Ejecuta una consulta tipada contra PostgreSQL.
     * @param text  Texto SQL a ejecutar.
     * @param params Parámetros opcionales para la consulta.
     */
    query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
}
export interface CustomQueryResult<T> {
    rows: T[];
    rowCount: number;
}
//# sourceMappingURL=database.interface.d.ts.map