import { createApp } from "./app.js";
import { env } from "./config/enviroment.js";
//import { rabbitMQClient } from "./config/raabbitmq.ts";
// ejecucion del worker
import './background/events';
import './background/notifications';
import { verifyTransporterConnection } from "./config/nodemailer.ts";

async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);
    await verifyTransporterConnection();
    app.listen(port, () => {
        console.log(`Notification Service running on port ${port}`);
    });
}

bootstrap().catch((error) => {
    console.error("Error starting Notification Service", error);
    process.exit(1);
});