/**
 * Integration Tests: AddCustomerNoteUseCase via HTTP
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
const mockQuery = jest.fn();
jest.unstable_mockModule('../src/config/query.js', () => ({
    databaseInstance: { query: mockQuery },
    Database: jest.fn(),
}));
jest.unstable_mockModule('../src/config/db.js', () => ({
    pool: {
        connect: jest.fn().mockResolvedValue({
            query: mockQuery,
            release: jest.fn(),
        }),
        on: jest.fn(),
    },
}));
const { createApp } = await import('../src/app.js');
const { default: request } = await import('supertest');
const fakeCustomer = { id: 5, first_name: 'Maria', status: 'active' };
const fakeNote = {
    id: 1,
    customer_id: 5,
    user_id: 18,
    note: 'Follow up call',
    created_at: new Date().toISOString()
};
const app = createApp();
describe('NoteService — AddCustomerNoteUseCase', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });
    describe('POST /api/v1/notes/:customer_id', () => {
        it('should add a note to a customer and return 201', async () => {
            // UnitOfWork sequence: BEGIN, findById, notes.save, auditLogs.save, COMMIT
            mockQuery
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [fakeCustomer] }) // customers.findById
                .mockResolvedValueOnce({ rows: [fakeNote] }) // notes.save
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // auditLogs.save
                .mockResolvedValueOnce({ rows: [] }); // COMMIT
            const res = await request(app)
                .post('/api/v1/notes/5')
                .send({ note: 'Follow up call' });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.response.details).toMatchObject({
                customer_id: 5,
                note: 'Follow up call',
            });
        });
        it('should return 404 if customer does not exist', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // customers.findById → not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
            const res = await request(app)
                .post('/api/v1/notes/9999')
                .send({ note: 'Ghost note' });
            expect(res.status).toBe(404);
        });
        it('should return 400 if note field is missing', async () => {
            const res = await request(app)
                .post('/api/v1/notes/5')
                .send({});
            expect(res.status).toBe(400);
        });
    });
});
//# sourceMappingURL=note.integration.test.js.map