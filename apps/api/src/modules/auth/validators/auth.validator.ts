import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { AUTH_MESSAGES } from "../constants/auth.constants.js";

/**
 * Login request validation schema.
 * Uses Zod v4 API.
 */
export const loginSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z
        .string({ error: "Password is required" })
        .min(6, "Password must be at least 6 characters"),
});

/**
 * Refresh token request validation schema.
 */
export const refreshTokenSchema = z.object({
    refreshToken: z
        .string({ error: "Refresh token is required" })
        .min(1, "Refresh token is required"),
});

/**
 * Logout request validation schema.
 * Reuses the refresh token schema as it expects the same body.
 */
export const logoutSchema = refreshTokenSchema;

/**
 * Generic Zod validation middleware factory.
 * Validates `req.body` against the provided schema.
 *
 * @param schema - A Zod schema to validate the request body against.
 * @returns Express middleware function.
 */
export function validateRequest(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            res.status(400).json({
                success: false,
                message: AUTH_MESSAGES.VALIDATION_ERROR,
                errors,
            });
            return;
        }

        // Replace req.body with the validated & transformed data
        req.body = result.data;
        next();
    };
}
