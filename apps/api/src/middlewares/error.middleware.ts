import type { Request, Response, NextFunction } from "express";
import { logger } from "@packages/logger/index.js";

/**
 * Custom Error Class
 * 
 * Allows setting a specific HTTP status code along with the error message.
 */
export class CustomError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and formats them into a standardized JSON response.
 * Prevents Express from sending the default HTML stack trace page.
 */
export const globalErrorHandler = (
    err: Error | CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof CustomError) {
        logger.warn(`Business Rule Exception: ${err.message}`, {
            path: req.path,
            method: req.method,
            statusCode: err.statusCode
        });
    } else {
        logger.error(`Unhandled Exception: ${err.message}`, {
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
    }

    if (err instanceof CustomError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: [],
        });
        return;
    }

    // Check if it's an authentication/authorization error
    if (err.message.includes("Invalid") || err.message.includes("failed") || err.message.includes("inactive") || err.message.includes("locked") || err.message.includes("not found")) {
        res.status(401).json({
            success: false,
            message: err.message,
            errors: [],
        });
        return;
    }

    // Default internal server error
    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
    });
};
