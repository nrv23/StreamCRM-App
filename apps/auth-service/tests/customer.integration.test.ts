/**
 * Integration Tests: Customer Use Cases via HTTP
 *
 * Strategy: We use jest.unstable_mockModule to mock the IDatabase instance
 * used by all repositories. Since this project uses ESM, jest.mock() cannot
 * be hoisted automatically, so we use the dynamic import approach instead.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ─────────────────────────────────────────────────────────────
// 1. Build the mock BEFORE any dynamic import
// ─────────────────────────────────────────────────────────────
const mockQuery = jest.fn();

// Mock the database singleton used by all repositories
jest.unstable_mockModule('../src/config/query.js', () => ({
    databaseInstance: { query: mockQuery },
    Database: jest.fn(),
}));

// Mock db.ts (pool) so no real PG connection is attempted
jest.unstable_mockModule('../src/config/db.js', () => ({
    pool: {
        connect: jest.fn().mockResolvedValue({
            query: mockQuery,
            release: jest.fn(),
        }),
        on: jest.fn(),
    },
}));

// ─────────────────────────────────────────────────────────────
// 2. Dynamic imports AFTER mocks are registered
// ─────────────────────────────────────────────────────────────
const { createApp } = await import('../src/app.js');
const { default: request } = await import('supertest');

// ─────────────────────────────────────────────────────────────
// Fake data
// ─────────────────────────────────────────────────────────────
const fakeCustomer = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    country: 'CR',
    status: 'active',
};

const app = createApp();

describe('CustomerService — Integration Tests via HTTP', () => {

    beforeEach(() => {
        mockQuery.mockReset();
    });

    // ─────────────────────────────────────────────────────────
    // CREATE CUSTOMER
    // ─────────────────────────────────────────────────────────
    describe('POST /api/v1/customers — CreateCustomerUseCase', () => {

        it('should create a customer and return 201', async () => {
            // UnitOfWork uses pool.connect() + client.query() sequence:
            // BEGIN, findByEmail, customers.save, events.save, auditLogs.save, COMMIT
            mockQuery
                .mockResolvedValueOnce({ rows: [] })              // BEGIN
                .mockResolvedValueOnce({ rows: [] })              // findByEmail → not found
                .mockResolvedValueOnce({ rows: [fakeCustomer] })  // customers.save
                .mockResolvedValueOnce({ rows: [{ id: 99 }] })   // events.save
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // auditLogs.save
                .mockResolvedValueOnce({ rows: [] });             // COMMIT

            const res = await request(app)
                .post('/api/v1/customers')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    country: 'CR',
                    createByUser: 1,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.response.details).toMatchObject({
                first_name: 'John',
                email: 'john@example.com',
            });
        });

        it('should return 409 if email already exists', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })              // BEGIN
                .mockResolvedValueOnce({ rows: [fakeCustomer] }) // findByEmail → found!
                .mockResolvedValueOnce({ rows: [] });             // ROLLBACK

            const res = await request(app)
                .post('/api/v1/customers')
                .send({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    country: 'CR',
                    createByUser: 1,
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/customers')
                .send({ email: 'missing@name.com' }); // missing firstName, lastName, country, createByUser

            expect(res.status).toBe(400);
        });
    });

    // ─────────────────────────────────────────────────────────
    // UPDATE CUSTOMER
    // ─────────────────────────────────────────────────────────
    describe('PUT /api/v1/customers/:id — UpdateCustomerUseCase', () => {

        it('should update a customer and return 200', async () => {
            const updatedCustomer = { ...fakeCustomer, first_name: 'Jane' };
            mockQuery
                .mockResolvedValueOnce({ rows: [] })               // BEGIN
                .mockResolvedValueOnce({ rows: [fakeCustomer] })   // findById
                .mockResolvedValueOnce({ rows: [updatedCustomer] }) // customers.update
                .mockResolvedValueOnce({ rows: [{ id: 100 }] })   // events.save
                .mockResolvedValueOnce({ rows: [{ id: 2 }] })     // auditLogs.save
                .mockResolvedValueOnce({ rows: [] });              // COMMIT

            const res = await request(app)
                .put('/api/v1/customers/1')
                .send({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane@example.com',
                    phone: '0987654321',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.response.details.first_name).toBe('Jane');
        });

        it('should return 404 if customer does not exist', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })  // BEGIN
                .mockResolvedValueOnce({ rows: [] })  // findById → not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .put('/api/v1/customers/9999')
                .send({
                    firstName: 'Ghost',
                    lastName: 'User',
                    email: 'ghost@example.com',
                    phone: '0000000000',
                });

            expect(res.status).toBe(404);
        });
    });

    // ─────────────────────────────────────────────────────────
    // SET CUSTOMER STATUS
    // ─────────────────────────────────────────────────────────
    describe('PATCH /api/v1/customers/status/:id — SetCustomerStatusUseCase', () => {

        it('should block a customer and return 200', async () => {
            const blockedCustomer = { ...fakeCustomer, status: 'blocked' };
            mockQuery
                .mockResolvedValueOnce({ rows: [] })               // BEGIN
                .mockResolvedValueOnce({ rows: [fakeCustomer] })   // findById (status: 'active')
                .mockResolvedValueOnce({ rows: [blockedCustomer] }) // setStatus
                .mockResolvedValueOnce({ rows: [{ id: 5 }] })     // statusHistory.save
                .mockResolvedValueOnce({ rows: [{ id: 101 }] })   // events.save
                .mockResolvedValueOnce({ rows: [{ id: 3 }] })     // auditLogs.save
                .mockResolvedValueOnce({ rows: [] });              // COMMIT

            const res = await request(app)
                .patch('/api/v1/customers/status/1')
                .send({ status: 'blocked' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.response.message).toBe('Customer deleted');
        });

        it('should return 409 if customer already has the same status', async () => {
            // fakeCustomer.status = 'active', sending 'active' → conflict
            mockQuery
                .mockResolvedValueOnce({ rows: [] })              // BEGIN
                .mockResolvedValueOnce({ rows: [fakeCustomer] }) // findById (status: 'active')
                .mockResolvedValueOnce({ rows: [] });             // ROLLBACK

            const res = await request(app)
                .patch('/api/v1/customers/status/1')
                .send({ status: 'active' });

            expect(res.status).toBe(409);
        });

        it('should return 404 if customer does not exist', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })  // BEGIN
                .mockResolvedValueOnce({ rows: [] })  // findById → not found
                .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

            const res = await request(app)
                .patch('/api/v1/customers/status/9999')
                .send({ status: 'blocked' });

            expect(res.status).toBe(404);
        });
    });
});
