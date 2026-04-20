import express from "express";
import path from "path";
import cors from "cors";
import { config } from "./config/env.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.clientOrigin.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
    })
  );
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(config.uploadDir)));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "Suraksha AI backend is running.",
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/reports", reportRoutes);

  app.use(errorHandler);

  return app;
}
