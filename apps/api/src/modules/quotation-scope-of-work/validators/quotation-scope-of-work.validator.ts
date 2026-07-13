import { z } from "zod";
import { QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES } from "../constants/quotation-scope-of-work.constants.js";
import type { Request, Response, NextFunction } from "express";

export const createQuotationScopeOfWorkSchema = z.object({
    body: z.object({
        title: z.string().min(1, QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.TITLE_REQUIRED).max(255),
        value: z.string().min(1, QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.VALUE_REQUIRED),
        sortOrder: z.number().int().min(0).optional().default(0),
        isDefault: z.number().int().min(0).max(1).optional().default(0)
    }),
});

export const updateQuotationScopeOfWorkSchema = z.object({
    params: z.object({
        uid: z.string().uuid(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.INVALID_UID),
    }),
    body: z.object({
        title: z.string().min(1, QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.TITLE_REQUIRED).max(255).optional(),
        value: z.string().min(1, QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.VALUE_REQUIRED).optional(),
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
    }),
});

export const getQuotationScopeOfWorkParamsSchema = z.object({
    params: z.object({
        uid: z.string().uuid(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.INVALID_UID),
    }),
});

export const listQuotationScopeOfWorkSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional().default("active"),
        sortBy: z.enum(["sort_order", "created_at"]).optional().default("sort_order"),
        sortDir: z.enum(["asc", "desc"]).optional().default("asc"),
    }),
});

export function validateRequest(schema: z.ZodTypeAny) {
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
                message: "Validation Error",
                errors,
            });
            return;
        }

        const data = result.data as Record<string, any>;

        if (data.body) req.body = data.body;
        if (data.query) req.query = data.query;
        if (data.params) req.params = data.params;
        
        next();
    };
}
