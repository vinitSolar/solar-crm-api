import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createProductSchema = z.object({
    categoryUid: z.string().uuid("Invalid Category UID"),
    brandUid: z.string().uuid("Invalid Brand UID"),
    unitUid: z.string().uuid("Invalid Unit UID"),
    name: z.string().min(1, "Name is required").max(500),
    productCode: z.string().min(1, "Product code is required").max(255),
    pricePerUnit: z.coerce.number().min(0, "Price per unit must be a positive number"),
    gstPercentage: z.coerce.number().min(0).max(100, "GST percentage must be between 0 and 100"),
    capacity: z.string().max(255).optional(),
    capacityUnit: z.string().max(100).optional(),
    warranty: z.string().max(255).optional(),
    description: z.string().optional(),
    modelNumber: z.string().max(255).optional(),
});

export const updateProductSchema = z.object({
    categoryUid: z.string().uuid("Invalid Category UID").optional(),
    brandUid: z.string().uuid("Invalid Brand UID").optional(),
    unitUid: z.string().uuid("Invalid Unit UID").optional(),
    name: z.string().min(1).max(500).optional(),
    productCode: z.string().min(1).max(255).optional(),
    pricePerUnit: z.coerce.number().min(0).optional(),
    gstPercentage: z.coerce.number().min(0).max(100).optional(),
    capacity: z.string().max(255).optional().nullable(),
    capacityUnit: z.string().max(100).optional().nullable(),
    warranty: z.string().max(255).optional().nullable(),
    description: z.string().optional().nullable(),
    modelNumber: z.string().max(255).optional().nullable(),
    existingImages: z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return [];
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === "string") {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
                return [val];
            }
        }
        return [];
    }, z.array(z.string())).optional(),
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

const sanitizeFilterUid = (val: unknown): string | undefined => {
    if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") {
        return undefined;
    }
    return String(val);
};

export const paginationSchema = z.object({
    page: z.preprocess(sanitizePage, z.number().int().min(1)),
    limit: z.preprocess(sanitizeLimit, z.number().int().min(1).max(100)),
    search: z.string().optional(),
    categoryUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Category UID").optional()),
    brandUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Brand UID").optional()),
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
