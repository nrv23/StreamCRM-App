import { PoolClient } from 'pg';
import { CustomerRepository } from '../repository/customer/customer-repository.repository.js';
import { OutboxEventRepository } from '../repository/customer/outbox_event-repository.repository.js';
import { IDatabase } from '../interfaces/database.interface.js';
import { pool } from './db.js';
import { TagRepository } from '../repository/tag/tag.repository.js';
import { NoteRepository } from '../repository/note/note.repository.js';
import { CustomerStatusHistoryRepository } from '../repository/customer/customer-status-history-repository.repository.js';

// Adaptador para cumplir con la interfaz IDatabase usando el cliente de pg
class PgClientAdapter implements IDatabase {
    constructor(private client: PoolClient) { }
    async query<T = any>(text: string, params?: any[]): Promise<T[]> {
        const res = await this.client.query(text, params);
        return res.rows as T[];
    }
}

export interface IUnitOfWorkRepositories {
    customers: CustomerRepository;
    events: OutboxEventRepository;
    tags: TagRepository;
    notes: NoteRepository;
    customerStatusHistory: CustomerStatusHistoryRepository
}

export class UnitOfWork {

    private getRepos(dbAdapter: PgClientAdapter): IUnitOfWorkRepositories {

        return {
            customers: new CustomerRepository(dbAdapter),
            events: new OutboxEventRepository(dbAdapter),
            tags: new TagRepository(dbAdapter),
            notes: new NoteRepository(dbAdapter),
            customerStatusHistory: new CustomerStatusHistoryRepository(dbAdapter)
        }
    }

    /**
     * Ejecuta una serie de operaciones dentro de una transacción segura.
     * Mantiene las referencias de conexión locales para evitar race conditions.
     */
    async execute<T>(work: (repos: IUnitOfWorkRepositories) => Promise<T>): Promise<T> {
        // 1. Tomamos un cliente dedicado del Pool
        const client = await pool.connect();

        // Adaptamos el cliente a nuestra interfaz común
        const dbAdapter = new PgClientAdapter(client);

        // 2. Inicializamos los repositorios localmente pasándoles el cliente transaccional


        try {
            // 3. Empezamos la transacción en Postgres
            await client.query('BEGIN');

            // 4. Ejecutamos la lógica de negocio que nos pasaron con las instancias locales
            const result = await work(this.getRepos(dbAdapter));

            // 5. Si todo salió bien, guardamos cambios
            await client.query('COMMIT');
            return result;

        } catch (error) {
            // 6. Si algo falló, revertimos TODO
            await client.query('ROLLBACK');
            throw error; // Re-lanzamos el error para el controlador
        } finally {
            // 7. SIEMPRE liberamos el cliente de vuelta al pool
            client.release();
        }
    }
}