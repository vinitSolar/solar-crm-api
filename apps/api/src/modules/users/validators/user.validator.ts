import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { USER_MESSAGES } from "../constants/user.constants.js";

export const getPaginatedUsersSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
        canSiteSurvey: z.number().int().min(0).max(1).optional(),
        canInstallation: z.number().int().min(0).max(1).optional(),
    })
});

export const createUserSchema = z.object({
    body: z.object({
        roleUid: z.string().uuid(USER_MESSAGES.INVALID_ROLE_UID),
        firstName: z.string().min(2, USER_MESSAGES.FIRST_NAME_MIN_LENGTH).max(100, USER_MESSAGES.FIRST_NAME_MAX_LENGTH),
        lastName: z.string().min(2, USER_MESSAGES.LAST_NAME_MIN_LENGTH).max(100, USER_MESSAGES.LAST_NAME_MAX_LENGTH),
        email: z.string().email(USER_MESSAGES.INVALID_EMAIL),
        password: z.string().min(8, USER_MESSAGES.PASSWORD_MIN_LENGTH),
    })
});

export const updateUserSchema = z.object({
    params: z.object({
        uid: z.string().uuid(USER_MESSAGES.INVALID_UID),
    }),
    body: z.object({
        roleUid: z.string().uuid(USER_MESSAGES.INVALID_ROLE_UID).optional(),
        firstName: z.string().min(2, USER_MESSAGES.FIRST_NAME_MIN_LENGTH).max(100, USER_MESSAGES.FIRST_NAME_MAX_LENGTH).optional(),
        lastName: z.string().min(2, USER_MESSAGES.LAST_NAME_MIN_LENGTH).max(100, USER_MESSAGES.LAST_NAME_MAX_LENGTH).optional(),
        email: z.string().email(USER_MESSAGES.INVALID_EMAIL).optional(),
        password: z.string().min(8, USER_MESSAGES.PASSWORD_MIN_LENGTH).optional(),
        isActive: z.number().int().min(0).max(2).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: USER_MESSAGES.UPDATE_NO_FIELDS,
    })
});

export const getUserSchema = z.object({
    params: z.object({
        uid: z.string().uuid(USER_MESSAGES.INVALID_UID),
    })
});

export const deleteUserSchema = z.object({
    params: z.object({
        uid: z.string().uuid(USER_MESSAGES.INVALID_UID),
    })
});

export const restoreUserSchema = z.object({
    params: z.object({
        uid: z.string().uuid(USER_MESSAGES.INVALID_UID),
    })
});

export const getAllUsersSchema = z.object({
    body: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
        canSiteSurvey: z.number().int().min(0).max(1).optional(),
        canInstallation: z.number().int().min(0).max(1).optional(),
    })
});

export function validateUserRequest(schema: z.ZodTypeAny) {
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
                message: USER_MESSAGES.VALIDATION_ERROR,
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
