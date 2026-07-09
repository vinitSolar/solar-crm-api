import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createProductSchema = z.object({
    categoryUid: z.string().uuid("Invalid Category UID"),
    brandUid: z.string().uuid("Invalid Brand UID"),
    unitUid: z.string().uuid("Invalid Unit UID"),
    name: z.string().min(1, "Name is required").max(500),
    productCode: z.string().min(1, "Product code is required").max(255),
    pricePerUnit: z.number().min(0, "Price per unit must be a positive number"),
    gstPercentage: z.number().min(0).max(100, "GST percentage must be between 0 and 100"),
    capacity: z.string().max(255).optional(),
    capacityUnit: z.string().max(100).optional(),
    warranty: z.string().max(255).optional(),
    description: z.string().optional(),
});

export const updateProductSchema = z.object({
    categoryUid: z.string().uuid("Invalid Category UID").optional(),
    brandUid: z.string().uuid("Invalid Brand UID").optional(),
    unitUid: z.string().uuid("Invalid Unit UID").optional(),
    name: z.string().min(1).max(500).optional(),
    productCode: z.string().min(1).max(255).optional(),
    pricePerUnit: z.number().min(0).optional(),
    gstPercentage: z.number().min(0).max(100).optional(),
    capacity: z.string().max(255).optional().nullable(),
    capacityUnit: z.string().max(100).optional().nullable(),
    warranty: z.string().max(255).optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.coerce.number().min(0).max(1).optional(),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    categoryUid: z.string().uuid("Invalid Category UID").optional(),
    brandUid: z.string().uuid("Invalid Brand UID").optional(),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

export function validateProductRequest(schema: z.ZodType) {
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
