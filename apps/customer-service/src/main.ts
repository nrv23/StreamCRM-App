import { createApp } from "./app.js";
import { env } from "./config/env.js";

async function bootstrap() {
  const app = createApp();
  const port = Number(env.server_port);

  app.listen(port, () => {
    console.log(`Customer Service running on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Error starting Customer Service", error);
  process.exit(1);
});
