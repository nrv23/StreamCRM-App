import express from "express";
import { customerRoutes } from "./modules/customers";
export function createApp() {
    const app = express();
    app.use(express.json());
    app.get("/health", (_req, res) => {
        res.json({
            success: true,
            service: "customer-service",
            status: "ok",
        });
    });
    app.use("/api/v1/customers", customerRoutes);
    return app;
}
