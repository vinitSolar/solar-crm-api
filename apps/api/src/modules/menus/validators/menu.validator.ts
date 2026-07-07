import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { MENU_MESSAGES } from "../constants/menu.constants.js";

export const createMenuSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
    code: z.string().min(1, "Code is required").max(100, "Code cannot exceed 100 characters"),
    route: z.string().max(255, "Route cannot exceed 255 characters").optional(),
    icon: z.string().max(255, "Icon cannot exceed 255 characters").optional(),
    parentUid: z.string().uuid("Invalid Parent UID").optional(),
    sortOrder: z.number().int("Sort order must be an integer").optional(),
});

export const updateMenuSchema = z.object({
    name: z.string().min(1, "Name cannot be empty").max(255, "Name cannot exceed 255 characters").optional(),
    code: z.string().min(1, "Code cannot be empty").max(100, "Code cannot exceed 100 characters").optional(),
    route: z.string().max(255, "Route cannot exceed 255 characters").optional(),
    icon: z.string().max(255, "Icon cannot exceed 255 characters").optional(),
    parentUid: z.string().uuid("Invalid Parent UID").optional().nullable(),
    sortOrder: z.number().int("Sort order must be an integer").optional().nullable(),
    isActive: z.number().int().min(0).max(1).optional(),
});

export const paginationSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

/**
 * Generic Zod validation middleware factory for menu routes.
 * Validates `req.body` against the provided schema.
 *
 * @param schema - A Zod schema to validate the request body against.
 * @returns Express middleware function.
 */
export function validateMenuRequest(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            res.status(400).json({
                success: false,
                message: MENU_MESSAGES.VALIDATION_ERROR,
                errors,
            });
            return;
        }

        req.body = result.data;
        next();
    };
}
