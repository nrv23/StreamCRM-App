/**
 * Integration Tests: User Creation via HTTP (/api/v1/users)
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

const fakeCreatedUser = {
    id: 1,
    external_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test.user@example.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    created_at: new Date().toISOString(),
};

const app = createApp();

describe('UserService — Integration Tests via HTTP (/api/v1/users)', () => {

    beforeEach(() => {
        mockQuery.mockReset();
    });

    describe('POST /api/v1/users — Create User', () => {

        it('should create a user successfully and return 201', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })                 // BEGIN
                .mockResolvedValueOnce({ rows: [] })                 // findByEmail -> null
                .mockResolvedValueOnce({ rows: [fakeCreatedUser] })  // user.save
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })       // events.save
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })       // auditLogs.save
                .mockResolvedValueOnce({ rows: [] });                // COMMIT

            const res = await request(app)
                .post('/api/v1/users')
                .send({
                    email: 'test.user@example.com',
                    first_name: 'Juan',
                    last_name: 'Pérez',
                    password: 'SecurePassword123!'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.response.message).toBe('user created successfully');
        });

        it('should return 400 when required fields are missing or invalid', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .send({
                    email: 'invalid-email',
                    first_name: 'J', // less than 2 chars
                    password: '123'  // less than 6 chars
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBeDefined();
        });

    });
});
