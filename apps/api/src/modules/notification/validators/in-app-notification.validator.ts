/**
 * Notification Module — In-App Notification Validator
 */

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { IN_APP_NOTIFICATION_MESSAGES } from "../constants/in-app-notification.constants.js";

export const listNotificationsSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
    search: z.string().trim().optional(),
    readStatus: z.enum(["all", "unread", "read"]).optional().default("all"),
    status: z.enum(["active", "deleted", "all"]).optional().default("active")
});

export const notificationUidParamSchema = z.object({
    uid: z.string().uuid("Notification UID must be a valid UUID")
});

/**
 * Generic Zod validation middleware for request body.
 */
export function validateNotificationBody(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message
            }));

            res.status(400).json({
                success: false,
                message: IN_APP_NOTIFICATION_MESSAGES.VALIDATION_ERROR,
                errors
            });
            return;
        }

        req.body = result.data;
        next();
    };
}

/**
 * Zod validation middleware for request params.
 */
export function validateNotificationParams(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message
            }));

            res.status(400).json({
                success: false,
                message: IN_APP_NOTIFICATION_MESSAGES.VALIDATION_ERROR,
                errors
            });
            return;
        }

        req.params = result.data as Record<string, string>;
        next();
    };
}
