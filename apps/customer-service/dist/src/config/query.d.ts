import type { QueryResultRow } from "pg";
import { IDatabase } from "../interfaces/database.interface.js";
export declare class Database implements IDatabase {
    query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
}
export declare const databaseInstance: Database;
//# sourceMappingURL=query.d.ts.map