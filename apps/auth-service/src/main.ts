import { Client } from "pg";
import { createApp } from "./app.js";
import { connect as elasticSearchConnect } from "./config/elasticsearch.ts";
import { env } from "./config/enviroment.ts";
import { RedisBootstrap } from "./config/redis.ts";
import { ListenNotifyDb } from "./listener/ListenNotifyDb.listener.ts";
import { RabbitEventPublisher } from "./publisher/RabbitEvent.publisher.ts";
import { OutboxEventRepository } from "./repository/user/outbox_event-repository.repository.ts";
import { AUTH_OUTBOX_EVENTS, LOGIN_USER } from "./shared/types/events.type.ts";

// ejecucion del worker
import './background/events';

async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);
    // conecion con elastic search

    await Promise.all([
        elasticSearchConnect(),
        RedisBootstrap.getInstance().init(),
    ]);

    const listener = new ListenNotifyDb(new Client({
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
        user: env.db.user,
        password: env.db.password,
        connectionTimeoutMillis: 5_000,
        query_timeout: 60_000,
    }), new RabbitEventPublisher(),
        new OutboxEventRepository()
    )

    await listener.connect();
    await listener.listen(AUTH_OUTBOX_EVENTS);

    app.listen(port, () => {
        console.log(`Auth Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Auth Service", error);
    process.exit(1);
});