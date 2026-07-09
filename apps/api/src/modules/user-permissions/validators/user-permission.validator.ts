import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const getMenuPermissionsSchema = z.object({
    params: z.object({
        userUid: z.string().uuid({ message: "Invalid user UID format" }),
    }),
});

export const upsertMenuPermissionsSchema = z.object({
    params: z.object({
        userUid: z.string().uuid({ message: "Invalid user UID format" }),
    }),
    body: z.object({
        permissions: z.array(
            z.object({
                menuUid: z.string().uuid({ message: "Invalid menu UID format" }),
                canView: z.union([z.literal(0), z.literal(1)]),
                canCreate: z.union([z.literal(0), z.literal(1)]),
                canEdit: z.union([z.literal(0), z.literal(1)]),
                canDelete: z.union([z.literal(0), z.literal(1)]),
            })
        ).min(1, { message: "Permissions array cannot be empty" }),
    }),
});

export const validateUserPermissionRequest = (schema: z.ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues,
            });
            return;
        }

        const data = result.data as any;

        if (data.body !== undefined) req.body = data.body;
        
        if (data.query !== undefined) {
            for (const key of Object.keys(req.query)) delete (req.query as any)[key];
            Object.assign(req.query, data.query);
        }
        
        if (data.params !== undefined) {
            for (const key of Object.keys(req.params)) delete (req.params as any)[key];
            Object.assign(req.params, data.params);
        }
        next();
    };
};
