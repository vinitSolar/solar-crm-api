import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { SURVEY_DOCUMENT_TYPE_MESSAGES, SURVEY_DOCUMENT_MESSAGES, SURVEY_DOCUMENT_VALIDATION_MESSAGES } from "../constants/survey-documents.constants.js";

export const createSurveyDocumentTypeSchema = z.object({
    body: z.object({
        name: z.string({ message: SURVEY_DOCUMENT_VALIDATION_MESSAGES.NAME_REQUIRED }).min(1, SURVEY_DOCUMENT_VALIDATION_MESSAGES.NAME_REQUIRED),
        description: z.string().optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().optional(),
    }).strict(),
});

export const updateSurveyDocumentTypeSchema = z.object({
    params: z.object({
        uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.UID_INVALID),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isRequired: z.number().int().min(0).max(1).optional(),
        allowMultiple: z.number().int().min(0).max(1).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.number().int().min(0).max(1).optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.UID_INVALID),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).optional(),
        search: z.string().optional(),
        status: z.union([z.literal("active"), z.literal("deleted"), z.literal("all")]).optional(),
    }),
});

export const uploadDocumentSchema = z.object({
    params: z.object({
        uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.SURVEY_UID_INVALID),
    }),
    body: z.object({
        document_type_uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.DOC_TYPE_UID_INVALID),
        remarks: z.string().optional(),
    }),
});

export const getSurveyDocumentsSchema = z.object({
    params: z.object({
        uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.SURVEY_UID_INVALID),
    }),
});

export const deleteDocumentSchema = z.object({
    params: z.object({
        document_uid: z.string().uuid(SURVEY_DOCUMENT_VALIDATION_MESSAGES.UID_INVALID),
    }),
});

export function validateSurveyDocumentRequest(schema: z.ZodTypeAny) {
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
                message: SURVEY_DOCUMENT_MESSAGES.VALIDATION_FAILED,
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
