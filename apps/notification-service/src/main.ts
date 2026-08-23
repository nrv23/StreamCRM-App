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
import { RedisPublisher } from "./publisher/Redis.publisher.ts";
import { RedisSubscriber } from "./consumer/RedisSubscriber.consumer.ts";
import { STREAM_CRM_EVENT } from "./shared/types/events.type..ts";


async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);

    // iniciar los sercicios al mismo tiempo

    await Promise.all([
        await verifyTransporterConnection(),
        await elasticSearchConnect(),
        await RedisBootstrap.getInstance().init()
    ])

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

    // hacer una prueba del pub/sub de redis 

    /*const redisPublisher = new RedisPublisher(RedisBootstrap.getInstance().getPublisher());
    const redisSubscriber = new RedisSubscriber(RedisBootstrap.getInstance().getSubscriber());

    await redisSubscriber.subscribe(STREAM_CRM_EVENT, (message) => {
        console.log(
            "[Redis SUB] received:",
            message
        );
    })

    await redisPublisher.publish(STREAM_CRM_EVENT, {
        room: "user:18",
        event: "notification.created",
        payload: {
            message: "Redis Pub/Sub funcionando papá"
        }
    });*/



    httpServer.listen(port, () => {
        console.log(`Notification Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Notification Service", error);
    process.exit(1);
});