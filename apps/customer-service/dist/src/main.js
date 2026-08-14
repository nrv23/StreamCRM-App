import { createApp } from "./app.js";
import { env } from "./config/enviroment.js";
//import { rabbitMQClient } from "./config/raabbitmq.ts";
// ejecucion del worker
import './background/events';
import { connect as elasticSearchConnect } from "./config/elasticsearch.js";
async function bootstrap() {
    const app = createApp();
    //await rabbitMQClient.connect()
    const port = Number(env.server_port);
    // conecion con elastic search
    await elasticSearchConnect();
    app.listen(port, () => {
        console.log(`Customer Service running on port ${port}`);
    });
}
bootstrap().catch((error) => {
    console.error("Error starting Customer Service", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map