import { createApp } from "./app";

async function bootstrap() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);

  app.listen(port, () => {
    console.log(`Customer Service running on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Error starting Customer Service", error);
  process.exit(1);
});
