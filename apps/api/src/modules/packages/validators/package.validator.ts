import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const packageProductSchema = z.object({
    productUid: z.string().uuid("Invalid Product UID"),
    quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
    remarks: z.string().max(1000).optional().nullable(),
});

export const createPackageSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
    packageCode: z.string().min(1, "Package code is required").max(100, "Package code cannot exceed 100 characters"),
    description: z.string().optional().nullable(),
    capacityKw: z.coerce.number().min(0, "Capacity cannot be negative").optional().nullable(),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    products: z.array(packageProductSchema).min(1, "A package must contain at least one product"),
});

export const updatePackageSchema = z.object({
    name: z.string().min(1, "Name is required").max(255).optional(),
    packageCode: z.string().min(1, "Package code is required").max(100).optional(),
    description: z.string().optional().nullable(),
    capacityKw: z.coerce.number().min(0, "Capacity cannot be negative").optional().nullable(),
    price: z.coerce.number().min(0, "Price must be a positive number").optional(),
    isActive: z.coerce.number().min(0).max(1).optional(),
    products: z.array(packageProductSchema).min(1, "A package must contain at least one product").optional(),
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
    capacityKw: z.coerce.number().optional(),
});

export function validatePackageRequest(schema: z.ZodType) {
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
