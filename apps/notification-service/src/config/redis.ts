import {
    createClient,
    RedisClientType,
} from "redis";

import { env } from "./enviroment.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";
import { Logger } from "winston";


export interface IBootstrap {
    init(): Promise<void>;
    close(): Promise<void>;
}

const logger: Logger = WinstonLogger.getInstance(env.elastic_search_url,
    'config-db-module',
    'debug',
    env.index_elastic_search_name);


export class RedisBootstrap implements IBootstrap {

    private static _instance: RedisBootstrap;

    private readonly _publisherClient: RedisClientType;
    private readonly _subscriberClient: RedisClientType;

    private _initialized = false;


    private constructor() {

        const redisConfig = env.redis;
        const socketOptions = {
            host: redisConfig.redis_host,
            port: Number(redisConfig.redis_port),
            reconnectStrategy: (retries: number) => {
                const delay = Math.min(retries * 100, 3000);
                logger.info(`[Redis Publisher] reconnect attempt=${retries} delay=${delay}ms`);
                return delay;
            }
        };

        this._publisherClient = createClient({
            username: redisConfig.redis_username || 'default', // Usa 'default' si no hay ACLs creadas
            password: redisConfig.redis_password,
            socket: socketOptions
        });

        this._subscriberClient = this._publisherClient.duplicate();
        this.registerEvents();
    }


    /**
     * Retorna la única instancia de RedisBootstrap
     * dentro de ESTE proceso de Node.
     */
    public static getInstance(): RedisBootstrap {

        if (!RedisBootstrap._instance) {
            RedisBootstrap._instance = new RedisBootstrap();
        }

        return RedisBootstrap._instance;
    }


    /**
     * Abre las dos conexiones:
     *
     * - publisher
     * - subscriber
     *
     * Solo debe ejecutarse una vez durante bootstrap.
     */
    public async init(): Promise<void> {

        if (this._initialized) {
            logger.info("RedisBootstrap is not iniitalized")
            return;
        }

        await Promise.all([
            this._publisherClient.connect(),
            this._subscriberClient.connect()
        ]);

        this._initialized = true;

        logger.info(
            "[Redis] Publisher and Subscriber connected"
        );
    }


    /**
     * Cliente dedicado a PUBLISH.
     */
    public getPublisher(): RedisClientType {
        return this._publisherClient;
    }


    /**
     * Cliente dedicado a SUBSCRIBE.
     */
    public getSubscriber(): RedisClientType {
        return this._subscriberClient;
    }


    /**
     * Cierra ambas conexiones Redis.
     */
    public async close(): Promise<void> {

        const closeOperations: Promise<unknown>[] = [];

        if (this._publisherClient.isOpen) {
            closeOperations.push(
                this._publisherClient.close()
            );
        }

        if (this._subscriberClient.isOpen) {
            closeOperations.push(
                this._subscriberClient.close()
            );
        }

        await Promise.all(closeOperations);

        this._initialized = false;

        logger.warning(
            "[Redis] Connections closed"
        );
    }


    private registerEvents(): void {

        /*
         * Publisher events
         */

        this._publisherClient.on(
            "error",
            (error) => {
                logger.error(
                    "[Redis Publisher] error",
                    error
                );
            }
        );


        this._publisherClient.on(
            "reconnecting",
            () => {
                logger.info(
                    "[Redis Publisher] reconnecting..."
                );
            }
        );


        this._publisherClient.on(
            "ready",
            () => {
                logger.info(
                    "[Redis Publisher] ready"
                );
            }
        );


        this._publisherClient.on(
            "end",
            () => {
                logger.info(
                    "[Redis Publisher] connection ended"
                );
            }
        );


        /*
         * Subscriber events
         */

        this._subscriberClient.on(
            "error",
            (error) => {
                logger.error(
                    "[Redis Subscriber] error",
                    error
                );
            }
        );


        this._subscriberClient.on(
            "reconnecting",
            () => {
                logger.info(
                    "[Redis Subscriber] reconnecting..."
                );
            }
        );


        this._subscriberClient.on(
            "ready",
            () => {
                logger.info(
                    "[Redis Subscriber] ready"
                );
            }
        );


        this._subscriberClient.on(
            "end",
            () => {
                logger.info(
                    "[Redis Subscriber] connection ended"
                );
            }
        );
    }
}