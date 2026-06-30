import express, { Application } from "express";
import { customerRoutes } from "./modules/customers/index.js";

export function createApp(): Application {
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
