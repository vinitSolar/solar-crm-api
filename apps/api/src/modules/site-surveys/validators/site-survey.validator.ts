import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { SITE_SURVEY_MESSAGES, SITE_SURVEY_VALIDATION_MESSAGES } from "../constants/site-survey.constants.js";

export const createSiteSurveySchema = z.object({
    body: z.object({
        leadUid: z.string({ message: SITE_SURVEY_VALIDATION_MESSAGES.LEAD_UID_REQUIRED }).uuid(SITE_SURVEY_VALIDATION_MESSAGES.LEAD_UID_INVALID),
        assignedTo: z.string({ message: SITE_SURVEY_VALIDATION_MESSAGES.USER_UID_REQUIRED }).uuid(SITE_SURVEY_VALIDATION_MESSAGES.USER_UID_INVALID),
        scheduledAt: z.string({ message: SITE_SURVEY_VALIDATION_MESSAGES.SCHEDULED_AT_REQUIRED }).refine((val) => !isNaN(Date.parse(val)), {
            message: SITE_SURVEY_VALIDATION_MESSAGES.SCHEDULED_AT_INVALID,
        }),
        remarks: z.string().optional(),
    }),
});

export const updateSiteSurveySchema = z.object({
    params: z.object({
        uid: z.string().uuid(SITE_SURVEY_VALIDATION_MESSAGES.UID_INVALID),
    }),
    body: z.object({
        assignedTo: z.string().uuid(SITE_SURVEY_VALIDATION_MESSAGES.USER_UID_INVALID).optional(),
        scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: SITE_SURVEY_VALIDATION_MESSAGES.SCHEDULED_AT_INVALID,
        }).optional(),
        status: z.number().int().min(0).max(3).optional(),
        remarks: z.string().optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid(SITE_SURVEY_VALIDATION_MESSAGES.UID_INVALID),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).optional(),
        search: z.string().optional(),
        surveyStatus: z.number().int().min(0).max(3).optional(),
        status: z.union([z.literal("active"), z.literal("deleted"), z.literal("all")]).optional(),
        scheduledDate: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        assignedTo: z.string().uuid().optional(),
        leadUid: z.string().uuid().optional(),
    }),
});

export function validateSiteSurveyRequest(schema: z.ZodTypeAny) {
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
                message: SITE_SURVEY_MESSAGES.VALIDATION_FAILED,
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
