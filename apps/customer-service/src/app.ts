import express, { Application } from "express";
import { CustomerRoutes } from "./routes/customer.route.js";
import { errorHandler } from "./shared/utils/error-handler.js";


export function createApp(): Application {
    const app = express();
    // 1. Para parsear peticiones con formato JSON (el estándar de tu API / Postman)
    app.use(express.json());

    // 2. Para parsear peticiones con formato "application/x-www-form-urlencoded"
    app.use(express.urlencoded({ extended: true }));

    app.get("/health", (_req, res) => {
        res.json({
            success: true,
            service: "customer-service",
            status: "ok",
        });
    });

    app.use("/api/v1/customers", new CustomerRoutes().BuildCustomerRoutes());
    app.use(errorHandler); // manejador de errores generico
    return app;
}