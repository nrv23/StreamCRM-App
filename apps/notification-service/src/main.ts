import { createApp } from "./app.js";
import { env } from "./config/enviroment.js";
//import { rabbitMQClient } from "./config/raabbitmq.ts";
// ejecucion del worker
import './background/events/consumer';
import './background/notifications';
import './background/dlq';

import { verifyTransporterConnection } from "./config/nodemailer.ts";
import { connect as elasticSearchConnect } from "./config/elasticsearch.ts";

async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);
    await verifyTransporterConnection();
    await elasticSearchConnect();
    app.listen(port, () => {
        console.log(`Notification Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Notification Service", error);
    process.exit(1);
});