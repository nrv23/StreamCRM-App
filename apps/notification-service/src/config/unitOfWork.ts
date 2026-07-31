import { PoolClient } from 'pg';
import { OutboxEventRepository } from '../repository/event/outbox_event-repository.repository.ts';
import { IDatabase } from '../interfaces/database.interface.js';
import { pool } from './db.js';
import { ProcessedEventRepository } from '../repository/processedEvent/processedEvent-repository.repository.ts';
import { NotificationRepository } from '../repository/notification/notification-repository.repository.ts';
import { NotificationDeliveryRepository } from '../repository/notification/notification-delivery-repository.repository.ts';

// Adaptador para cumplir con la interfaz IDatabase usando el cliente de pg
class PgClientAdapter implements IDatabase {
    constructor(private client: PoolClient) { }
    async query<T = any>(text: string, params?: any[]): Promise<T[]> {
        const res = await this.client.query(text, params);
        return res.rows as T[];
    }
}

export interface IUnitOfWorkRepositories {
    events: OutboxEventRepository;
    processedEvents: ProcessedEventRepository;
    notification: NotificationRepository;
    notificationDelivery: NotificationDeliveryRepository
}

export class UnitOfWork {

    private getRepos(dbAdapter: PgClientAdapter): IUnitOfWorkRepositories {

        return {

            events: new OutboxEventRepository(dbAdapter),
            processedEvents: new ProcessedEventRepository(dbAdapter),
            notification: new NotificationRepository(dbAdapter),
            notificationDelivery: new NotificationDeliveryRepository(dbAdapter)
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