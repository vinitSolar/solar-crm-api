import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

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

const optionSchema = z.object({
    value: z.string().min(1).max(255),
    sortOrder: z.coerce.number().optional(),
});

export const createProductSpecificationSchema = z.object({
    title: z.string().min(1).max(255),
    valueType: z.coerce.number().min(0).max(6),
    unitUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Unit UID").optional().nullable()),
    options: z.array(optionSchema).optional(),
    
    // Optional mapping fields
    categoryUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Category UID").optional()),
    sortOrder: z.coerce.number().optional(),
    isRequired: z.coerce.number().min(0).max(1).optional(),
});

export const updateProductSpecificationSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    valueType: z.coerce.number().min(0).max(6).optional(),
    unitUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Unit UID").optional().nullable()),
    isActive: z.coerce.number().min(0).max(1).optional(),
    options: z.array(optionSchema).optional(),
});

export const mapSpecificationToCategorySchema = z.object({
    specificationUid: z.string().uuid("Invalid Specification UID"),
    sortOrder: z.coerce.number().optional(),
    isRequired: z.coerce.number().min(0).max(1).optional(),
});

export const updateCategorySpecificationMappingSchema = z.object({
    sortOrder: z.coerce.number().optional(),
    isRequired: z.coerce.number().min(0).max(1).optional(),
    isActive: z.coerce.number().min(0).max(1).optional(),
});

export const paginationSchema = z.object({
    page: z.preprocess(sanitizePage, z.number().int().min(1)),
    limit: z.preprocess(sanitizeLimit, z.number().int().min(1).max(100)),
    search: z.string().optional(),
    categoryUid: z.preprocess(sanitizeFilterUid, z.string().uuid("Invalid Category UID").optional()),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

export function validateProductSpecificationRequest(schema: z.ZodType) {
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
