import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSION_MESSAGES } from "../constants/role-permission.constants.js";

const permissionFlag = z.number().int().min(0).max(1);

export const getMenuPermissionsSchema = z.object({
    params: z.object({
        roleUid: z.string().uuid(ROLE_PERMISSION_MESSAGES.INVALID_ROLE_UID),
    }),
});

export const upsertMenuPermissionsSchema = z.object({
    params: z.object({
        roleUid: z.string().uuid(ROLE_PERMISSION_MESSAGES.INVALID_ROLE_UID),
    }),
    body: z.object({
        permissions: z
            .array(
                z.object({
                    menuUid: z.string().uuid(ROLE_PERMISSION_MESSAGES.INVALID_MENU_UID),
                    canView: permissionFlag,
                    canCreate: permissionFlag,
                    canEdit: permissionFlag,
                    canDelete: permissionFlag,
                }),
            )
            .min(1, ROLE_PERMISSION_MESSAGES.PERMISSIONS_REQUIRED),
    }),
});

export function validateRolePermissionRequest(schema: z.ZodTypeAny) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            res.status(400).json({
                success: false,
                message: ROLE_PERMISSION_MESSAGES.VALIDATION_ERROR,
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
