// src/config/database.interface.ts
// Interface that abstracts the database access layer.
// Allows us to inject a mock implementation for unit tests
// while keeping the production implementation inside `query.ts`.

import type { QueryResultRow } from "pg";

export interface IDatabase {
  /**
   * Ejecuta una consulta tipada contra PostgreSQL.
   * @param text  Texto SQL a ejecutar.
   * @param params Parámetros opcionales para la consulta.
   */
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
}
