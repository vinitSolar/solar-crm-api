import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createFranchiseDocumentTypeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().min(0).optional(),
    }).strict(),
});

export const updateFranchiseDocumentTypeSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid Document Type UID"),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid Document Type UID"),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).optional(),
        search: z.string().optional(),
        status: z.union([z.literal("active"), z.literal("deleted"), z.literal("all")]).optional(),
    }),
});

export function validateRequest(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
            return;
        }

        const data = result.data as { body?: any; query?: any; params?: any };

        if (data.body !== undefined) {
            req.body = data.body;
        }
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
    };
}
