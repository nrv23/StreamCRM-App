import express, { Application } from "express";
import { errorHandler } from "./shared/utils/error-handler.js";
import { notFoundRouteHandler } from "./shared/utils/not-found-route-handler.js";

import { requestDataInfo } from "./shared/middleware/client-info.middleware.js";
import { MetricsController } from "./controllers/metrics.controller.ts";
import { MetricsRoutes } from "./routes/metrics.route.ts";
import MetricsService from "./services/metrics.service.ts";
import { NotificationRoutes } from "./routes/notifications.route.ts";

export function createApp(): Application {
    const app = express();

    // 1. Parsers SIEMPRE de primero
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 2. Configuración de Express
    app.enable('trust proxy');

    // 3. Middlewares globales
    app.use(requestDataInfo);

    app.get("/health", (_req, res) => {
        res.json({
            success: true,
            service: "notification-service",
            status: "ok",
        });
    });

    app.use(new MetricsController(new MetricsService()).metricsCounter);
    app.use(new MetricsRoutes().BuildRoutes());
    app.use('/api/v1/notifications', new NotificationRoutes().BuildRoutes());
    app.use(notFoundRouteHandler); // ruta no encontrada
    app.use(errorHandler); // manejador de errores generico


    return app;
}