import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createProductCellTechnologySchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateProductCellTechnologySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.coerce.number().min(0).max(1).optional(),
});

const sanitizePage = (val: unknown): number => {
    if (val === undefined || val === null || val === "") return 1;
    const coerced = Number(val);
    return isNaN(coerced) || coerced < 1 ? 1 : Math.floor(coerced);
};

const sanitizeLimit = (val: unknown): number => {
    if (val === undefined || val === null || val === "") return 10;
    const coerced = Number(val);
    if (isNaN(coerced) || coerced < 1) return 10;
    const limit = Math.floor(coerced);
    return limit > 100 ? 100 : limit;
};

export const paginationSchema = z.object({
    page: z.preprocess(sanitizePage, z.number().int().min(1)),
    limit: z.preprocess(sanitizeLimit, z.number().int().min(1).max(100)),
    search: z.string().optional(),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

export function validateProductCellTechnologyRequest(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation Error",
                errors,
            });
            return;
        }

        req.body = result.data;
        next();
    };
}
