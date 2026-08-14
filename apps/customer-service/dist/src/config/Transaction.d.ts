import type { PoolClient, QueryResultRow } from "pg";
export declare class Transaction {
    private readonly client;
    constructor(client: PoolClient);
    query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;
}
//# sourceMappingURL=Transaction.d.ts.map