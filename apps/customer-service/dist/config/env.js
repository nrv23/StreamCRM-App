export const env = {
    port: Number(process.env.PORT ?? 3001),
    databaseUrl: process.env.DATABASE_URL ?? "",
    rabbitmqUrl: process.env.RABBITMQ_URL ?? "",
    redisUrl: process.env.REDIS_URL ?? "",
};
