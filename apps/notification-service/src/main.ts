import { createApp } from "./app.js";
import { env } from "./config/enviroment.js";
//import { rabbitMQClient } from "./config/raabbitmq.ts";
// ejecucion del worker

import './background/notifications';
import './background/dlq';


import { verifyTransporterConnection } from "./config/nodemailer.ts";
import { connect as elasticSearchConnect } from "./config/elasticsearch.ts";
import { createServer } from "http";
import { SocketServer } from "./config/socketio.ts";
import { WinstonLogger } from "./shared/utils/winstonLogger.ts";
import { RedisBootstrap } from "./config/redis.ts";


async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);
    await verifyTransporterConnection();
    await elasticSearchConnect();
    await RedisBootstrap.getInstance().init();

    const httpServer = createServer(app);

    const socketServer = SocketServer.init( // esta clase es singleton porque solo maneja una conexion que se va distribuir por toda la api
        httpServer,
        WinstonLogger.getInstance(env.elastic_search_url,
            'server-socket',
            'debug',
            env.index_elastic_search_name
        )
    );

    const { startEventWorker } = await import(
        "./background/events/consumer/index.ts"
    );

    startEventWorker(socketServer);

    httpServer.listen(port, () => {
        console.log(`Notification Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Notification Service", error);
    process.exit(1);
});