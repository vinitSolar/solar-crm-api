import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createInstallationMilestoneSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        description: z.string().optional(),
        sortOrder: z.number().int().optional(),
        requiresDocument: z.number().int().optional(),
        allowMultipleImages: z.number().int().optional(),
    }),
});

export const updateInstallationMilestoneSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        description: z.string().optional(),
        sortOrder: z.number().int().optional(),
        requiresDocument: z.number().int().optional(),
        allowMultipleImages: z.number().int().optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
});

export const getAllSchema = z.object({
    query: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

export const validateInstallationMilestoneRequest =
    (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const zodError = error as any;
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: zodError.errors.map((e: any) => ({
                        path: e.path.join("."),
                        message: e.message,
                    })),
                });
            } else {
                next(error);
            }
        }
    };
