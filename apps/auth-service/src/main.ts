import { createApp } from "./app.js";
import { connect as elasticSearchConnect } from "./config/elasticsearch.ts";
import { env } from "./config/enviroment.ts";
import { RedisBootstrap } from "./config/redis.ts";

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


    app.listen(port, () => {
        console.log(`Auth Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Auth Service", error);
    process.exit(1);
});