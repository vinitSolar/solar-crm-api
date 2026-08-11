import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createFranchiseDocumentTypeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").max(100, "Name is too long"),
        description: z.string().max(255, "Description is too long").optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().min(0).optional(),
    }),
});

export const updateFranchiseDocumentTypeSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid document type UID"),
    }),
    body: z.object({
        name: z.string().min(1, "Name cannot be empty").max(100, "Name is too long").optional(),
        description: z.string().max(255, "Description is too long").optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    }),
});

export const getFranchiseDocumentTypeSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid document type UID"),
    }),
});

export const getPaginatedFranchiseDocumentTypesSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional().default("active"),
    }),
});

export const validateFranchiseDocumentTypeRequest = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const result = schema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: result.error.issues.map((issue: z.ZodIssue) => ({
                        path: issue.path.join("."),
                        message: issue.message,
                    })),
                });
                return;
            }

            const data = result.data as { body?: any; query?: any; params?: any };
            if (data.body !== undefined) req.body = data.body;
            if (data.query !== undefined) {
                for (const key of Object.keys(req.query)) {
                    delete req.query[key as string];
                }
                Object.assign(req.query, data.query);
            }
            if (data.params !== undefined) {
                for (const key of Object.keys(req.params)) {
                    delete req.params[key];
                }
                Object.assign(req.params, data.params);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
