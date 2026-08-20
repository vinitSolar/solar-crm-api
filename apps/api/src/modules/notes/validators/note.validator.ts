import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createNoteSchema = z.object({
    body: z.object({
        note: z.string().min(1, "Note cannot be empty").max(2000, "Note is too long"),
    }),
});

export const updateNoteSchema = z.object({
    body: z.object({
        note: z.string().min(1, "Note cannot be empty").max(2000, "Note is too long"),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
        module: z.string().optional(),
    }),
});

export const validateNoteRequest = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
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
                    errors: zodError.errors.map((err: any) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                });
                return;
            } else {
                next(error);
            }
        }
    };
};
