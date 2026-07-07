import { Pool, PoolClient } from 'pg';
import { CustomerRepository } from '../repository/customerRepository.repository.js';
import { OutboxEventRepository } from '../repository/outbox_event-repository.repository.js';
import { Database } from './query.js';
import { pool } from './db.js';

// Adaptador para cumplir con la interfaz DatabaseConnection usando el cliente de pg
class PgClientAdapter implements Database {
    constructor(private client: PoolClient) { }
    async query<T = any>(text: string, params?: any[]): Promise<T[]> {
        const res = await this.client.query(text, params);
        return res.rows as T[];
    }
}

export class UnitOfWork {
    private client: PoolClient | null = null;

    // Repositorios expuestos públicos
    public customers!: CustomerRepository;
    public events!: OutboxEventRepository;

    constructor() { }

    /**
     * Ejecuta una serie de operaciones dentro de una transacción segura.
     */
    async execute<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> {
        // 1. Tomamos un cliente dedicado del Pool
        this.client = await pool.connect();

        // Adaptamos el cliente a nuestra interfaz común
        const dbAdapter = new PgClientAdapter(this.client);

        // 2. Inicializamos los repositorios pasándoles el cliente transaccional
        this.customers = new CustomerRepository(dbAdapter);
        this.events = new OutboxEventRepository(dbAdapter);

        try {
            // 3. Empezamos la transacción en Postgres
            await this.client.query('BEGIN');

            // 4. Ejecutamos la lógica de negocio que nos pasaron
            const result = await work(this);

            // 5. Si todo salió bien, guardamos cambios
            await this.client.query('COMMIT');
            return result;

        } catch (error) {
            // 6. Si algo falló en cualquier repositorio, revertimos TODO
            if (this.client) await this.client.query('ROLLBACK');
            throw error; // Re-lanzamos el error para el controlador
        } finally {
            // 7. SIEMPRE liberamos el cliente de vuelta al pool
            if (this.client) {
                this.client.release();
                this.client = null;
            }
        }
    }
}