import type { PoolClient, QueryResultRow } from "pg";

export class Transaction {
    constructor(private readonly client: PoolClient) { }

    async query<T extends QueryResultRow>(
        text: string,
        params?: unknown[],
    ): Promise<T[]> {
        const result = await this.client.query<T>(text, params);
        return result.rows;
    }
}