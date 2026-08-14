import express from "express";
import { CustomerRoutes } from "./routes/customer.route.js";
import { errorHandler } from "./shared/utils/error-handler.js";
import { TagRoutes } from "./routes/tag.routes.js";
import { NotesRoutes } from "./routes/notes.routes.js";
import { notFoundRouteHandler } from "./shared/utils/not-found-route-handler.js";
import { requestDataInfo } from "./shared/middleware/client-info.middleware.js";
export function createApp() {
    const app = express();
    // Confiar en el proxy para que req.ip funcione bien si estás detrás de Nginx/Docker
    app.enable('trust proxy');
    // 1. Para parsear peticiones con formato JSON (el estándar de tu API / Postman)
    app.use(express.json());
    // 2. Para parsear peticiones con formato "application/x-www-form-urlencoded"
    app.use(express.urlencoded({ extended: true }));
    // 3. Extraer IP y User Agent globalmente
    app.use(requestDataInfo);
    app.get("/health", (_req, res) => {
        res.json({
            success: true,
            service: "customer-service",
            status: "ok",
        });
    });
    app.use("/api/v1/customers", new CustomerRoutes().BuildRoutes());
    app.use("/api/v1/tags", new TagRoutes().BuildRoutes());
    app.use("/api/v1/notes", new NotesRoutes().BuildRoutes());
    app.use(notFoundRouteHandler); // ruta no encontrada
    app.use(errorHandler); // manejador de errores generico
    return app;
}
//# sourceMappingURL=app.js.map