import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ROLE_MESSAGES } from "../constants/role.constants.js";
export const getPaginatedRolesSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
    })
});

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2, ROLE_MESSAGES.NAME_MIN_LENGTH).max(100, ROLE_MESSAGES.NAME_MAX_LENGTH),
        description: z.string().max(500, ROLE_MESSAGES.DESCRIPTION_MAX_LENGTH).optional(),
    })
});

export const updateRoleSchema = z.object({
    params: z.object({
        uid: z.string().uuid(ROLE_MESSAGES.INVALID_UID),
    }),
    body: z.object({
        name: z.string().min(2, ROLE_MESSAGES.NAME_MIN_LENGTH).max(100, ROLE_MESSAGES.NAME_MAX_LENGTH).optional(),
        description: z.string().max(500, ROLE_MESSAGES.DESCRIPTION_MAX_LENGTH).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: ROLE_MESSAGES.UPDATE_NO_FIELDS,
    })
});

export const getRoleSchema = z.object({
    params: z.object({
        uid: z.string().uuid(ROLE_MESSAGES.INVALID_UID),
    })
});

export const deleteRoleSchema = z.object({
    params: z.object({
        uid: z.string().uuid(ROLE_MESSAGES.INVALID_UID),
    })
});

export const restoreRoleSchema = z.object({
    params: z.object({
        uid: z.string().uuid(ROLE_MESSAGES.INVALID_UID),
    })
});

export const getAllRolesSchema = z.object({
    query: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
    })
});


export function validateRoleRequest(schema: z.ZodTypeAny) {
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
                message: ROLE_MESSAGES.VALIDATION_ERROR,
                errors,
            });
            return;
        }

        const data = result.data as { body?: any; query?: any; params?: any };

        // Apply validated properties back to the request
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
