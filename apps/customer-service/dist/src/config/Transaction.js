export class Transaction {
    client;
    constructor(client) {
        this.client = client;
    }
    async query(text, params) {
        const result = await this.client.query(text, params);
        return result.rows;
    }
}
//# sourceMappingURL=Transaction.js.map