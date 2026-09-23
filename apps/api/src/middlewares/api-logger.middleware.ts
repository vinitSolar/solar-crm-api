import type { Request, Response, NextFunction } from "express";
import { logger } from "@packages/logger/index.js";

const SENSITIVE_KEYS = ["password", "token", "refreshtoken", "otp", "secret", "authorization", "cookie"];

function sanitizeData(data: any): any {
    if (!data || typeof data !== "object") return data;
    if (Array.isArray(data)) return data.map(sanitizeData);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
            sanitized[key] = "***REDACTED***";
        } else if (typeof value === "object" && value !== null) {
            sanitized[key] = sanitizeData(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Middleware that logs any failed API requests (HTTP status >= 400) to the terminal.
 */
export function apiErrorLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    let responseBody: any;

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
        responseBody = body;
        return originalJson(body);
    };

    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
        if (!responseBody && typeof body === "string") {
            try {
                responseBody = JSON.parse(body);
            } catch {
                responseBody = body;
            }
        }
        return originalSend(body);
    };

    res.on("finish", () => {
        if (res.statusCode >= 400) {
            const duration = Date.now() - startTime;
            const message = responseBody?.message || responseBody?.error || (typeof responseBody === "string" ? responseBody : "Request failed");
            const errors = responseBody?.errors;

            const logMeta: Record<string, any> = {
                method: req.method,
                url: req.originalUrl || req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
            };

            if (errors && Array.isArray(errors) && errors.length > 0) {
                logMeta.errors = errors;
            }

            if (req.body && Object.keys(req.body).length > 0) {
                logMeta.body = sanitizeData(req.body);
            }

            if (req.query && Object.keys(req.query).length > 0) {
                logMeta.query = req.query;
            }

            if (req.params && Object.keys(req.params).length > 0) {
                logMeta.params = req.params;
            }

            logger.error(`❌ [API FAILED] ${req.method} ${req.originalUrl || req.url} - Status ${res.statusCode} (${duration}ms) - ${message}`, logMeta);
        }
    });

    next();
}
