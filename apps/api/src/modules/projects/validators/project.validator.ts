import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createProjectStatusSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isClosed: z.number().int().optional(),
        description: z.string().optional(),
    }),
});

export const updateProjectStatusSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isClosed: z.number().int().optional(),
        description: z.string().optional(),
    }).strict(),
});

export const createProjectSchema = z.object({
    body: z.object({
        quotationUid: z.string({ message: "Quotation UID is required" }).uuid("Invalid quotation UID format"),
        projectName: z.string({ message: "Project name is required" }).min(2, "Project name must be at least 2 characters"),
        projectManagerUid: z.string().uuid("Invalid project manager UID format").optional().nullable().or(z.literal("")),
        projectDate: z.string().optional(),
        remarks: z.string().optional(),
    }),
});

export const updateProjectSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        projectName: z.string().min(2, "Project name must be at least 2 characters").optional(),
        projectStatusUid: z.string().uuid("Invalid project status UID format").optional(),
        projectManagerUid: z.string().uuid("Invalid project manager UID format").optional().nullable().or(z.literal("")),
        projectDate: z.string().optional(),
        remarks: z.string().optional(),
    }).strict(),
});

export const changeProjectStatusSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        statusUid: z.string({ message: "Status UID is required" }).uuid("Invalid project status UID format"),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
        projectStatusUid: z.string().uuid("Invalid project status UID format").optional(),
        projectManagerUid: z.string().uuid("Invalid project manager UID format").optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

export const getAllSchema = z.object({
    query: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

export const validateProjectRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
