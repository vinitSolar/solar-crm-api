import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { PRODUCT_CATEGORY_MESSAGES } from "../constants/product-category.constants.js";

export const createProductCategorySchema = z.object({
    name: z.string({ message: "Name is required" }).min(1, "Name is required").max(255),
    description: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
});

export const updateProductCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
    isActive: z.coerce.number().min(0).max(1).optional(),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

export function validateProductCategoryRequest(schema: z.ZodType) {
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
