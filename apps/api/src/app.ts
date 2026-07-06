import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "@packages/config/index.js";
import { swaggerSpec } from "./config/swagger.js";
import apiRoutes from "./routes/index.js";

const app: Application = express();

/**
 * Security
 */
app.use(helmet());

/**
 * Enable CORS
 */
app.use(cors());

/**
 * Compress Responses
 */
app.use(compression());

/**
 * Parse Request Body
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Swagger API Documentation
 * Available at /api-docs in development
 */
if (env.APP.NODE_ENV === "development") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: `${env.APP.NAME} - API Docs`,
    }));
}

/**
 * API Routes
 */
app.use("/api/v1", apiRoutes);

/**
 * Health Check
 */
app.get("/health", (_, res) => {
    res.status(200).json({
        success: true,
        message: `${env.APP.NAME} API is running`,
    });
});

/**
 * Global Error Handler
 */
import { globalErrorHandler } from "./middlewares/error.middleware.js";
app.use(globalErrorHandler);

export default app;