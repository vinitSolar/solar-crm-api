import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createSubsidyDocumentTypeSchema = z.object({
    name: z.string({
        message: "Document type name is required",
    }).min(1, { message: "Document type name cannot be empty" }).max(255),
    description: z.string().optional().nullable(),
    allowMultiple: z.boolean().optional().default(false),
    isRequired: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional(),
});

export const updateSubsidyDocumentTypeSchema = z.object({
    name: z.string().min(1, { message: "Document type name cannot be empty" }).max(255).optional(),
    description: z.string().optional().nullable(),
    allowMultiple: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

export const subsidyDocumentTypePaginationSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
    search: z.string().optional(),
    status: z.enum(["active", "deleted", "all"]).optional().default("active"),
});

export const validateSubsidyDocumentTypeRequest = (schema: z.ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};
