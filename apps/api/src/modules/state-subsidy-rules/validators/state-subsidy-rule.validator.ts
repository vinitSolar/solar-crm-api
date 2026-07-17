import { z } from "zod";
import { STATE_SUBSIDY_RULE_MESSAGES } from "../constants/state-subsidy-rule.constants.js";
import type { Request, Response, NextFunction } from "express";

/**
 * Schema for creating a state subsidy rule.
 */
export const createStateSubsidyRuleSchema = z.object({
    body: z.object({
        stateUid: z.string().optional().nullable(),
        state: z.string({
            message: STATE_SUBSIDY_RULE_MESSAGES.STATE_REQUIRED,
        }).min(2, STATE_SUBSIDY_RULE_MESSAGES.STATE_REQUIRED).max(255),
        subsidyPerKw: z.number({
            message: STATE_SUBSIDY_RULE_MESSAGES.SUBSIDY_PER_KW_INVALID,
        }).min(0, STATE_SUBSIDY_RULE_MESSAGES.SUBSIDY_PER_KW_INVALID),
        maximumSubsidyAmount: z.number({
            message: STATE_SUBSIDY_RULE_MESSAGES.MAXIMUM_SUBSIDY_AMOUNT_INVALID,
        }).min(0, STATE_SUBSIDY_RULE_MESSAGES.MAXIMUM_SUBSIDY_AMOUNT_INVALID),
        description: z.string().optional(),
    }),
});

/**
 * Schema for updating a state subsidy rule.
 */
export const updateStateSubsidyRuleSchema = z.object({
    body: z.object({
        stateUid: z.string().optional().nullable(),
        state: z.string().min(2, STATE_SUBSIDY_RULE_MESSAGES.STATE_REQUIRED).max(255).optional(),
        subsidyPerKw: z.number().min(0, STATE_SUBSIDY_RULE_MESSAGES.SUBSIDY_PER_KW_INVALID).optional(),
        maximumSubsidyAmount: z.number().min(0, STATE_SUBSIDY_RULE_MESSAGES.MAXIMUM_SUBSIDY_AMOUNT_INVALID).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    }),
});

/**
 * Schema for paginated list requests.
 */
export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).default("active"),
    }),
});

/**
 * Generic validation middleware using Zod.
 */
export const validateStateSubsidyRuleRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
                    message: STATE_SUBSIDY_RULE_MESSAGES.VALIDATION_ERROR,
                    errors: error.issues.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
