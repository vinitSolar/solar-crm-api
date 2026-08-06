import { z } from "zod";
import { QUOTATION_VALIDATION_MESSAGES } from "../constants/quotation.constants.js";
import type { Request, Response, NextFunction } from "express";

export const createQuotationSchema = z.object({
    body: z.object({
        leadUid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_LEAD_UID),
        systemSize: z.number().positive(QUOTATION_VALIDATION_MESSAGES.SYSTEM_SIZE_POSITIVE).optional(),
        validTill: z.string().min(1, QUOTATION_VALIDATION_MESSAGES.VALID_TILL_REQUIRED),
        notes: z.string().max(1000, QUOTATION_VALIDATION_MESSAGES.NOTES_MAX).optional().nullable(),
        packageUid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_UID).optional(),
        subtotal: z.number().nonnegative(),
        gstAmount: z.number().nonnegative(),
        grandTotal: z.number().nonnegative(),
        subsidyData: z.array(z.object({
            uid: z.string().uuid(),
            name: z.string().min(1),
            amount: z.number().nonnegative()
        })).optional(),
        netCustomerCost: z.number().nonnegative(),
        packageProducts: z.array(z.object({
            productUid: z.string().uuid(),
            quantity: z.number().positive(),
            productName: z.string().optional(),
            pricePerUnit: z.number().optional(),
            gstPercentage: z.number().optional(),
            description: z.string().optional()
        })).optional(),
        extraProducts: z.array(z.object({
            productUid: z.string().uuid(),
            quantity: z.number().positive(),
            productName: z.string().optional(),
            pricePerUnit: z.number().optional(),
            gstPercentage: z.number().optional(),
            description: z.string().optional()
        })).optional(),
        scopeOfWork: z.array(z.object({
            scopeOfWorkUid: z.string().uuid().optional(),
            title: z.string().min(1).max(255).optional(),
            value: z.string().min(1).optional(),
            sortOrder: z.number().int().min(0).optional()
        })).optional(),
        extraScopeOfWork: z.array(z.object({
            scopeOfWorkUid: z.string().uuid().optional().nullable(),
            title: z.string().min(1).max(255).optional(),
            value: z.string().min(1).optional(),
            sortOrder: z.number().int().min(0).optional()
        })).optional(),
        termsConditions: z.array(z.object({
            title: z.string().min(1).max(255),
            description: z.array(z.string().min(1)),
            sortOrder: z.number().int().min(0).optional()
        })).optional()
    })
});

export const updateQuotationSchema = z.object({
    params: z.object({
        uid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_UID),
    }),
    body: z.object({
        leadUid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_LEAD_UID).optional(),
        systemSize: z.number().positive(QUOTATION_VALIDATION_MESSAGES.SYSTEM_SIZE_POSITIVE).optional(),
        validTill: z.string().min(1).optional(),
        notes: z.string().max(1000, QUOTATION_VALIDATION_MESSAGES.NOTES_MAX).optional().nullable(),
        status: z.number().int().min(0).max(4).optional(),
        packageUid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_UID).optional(),
        subtotal: z.number().nonnegative().optional(),
        gstAmount: z.number().nonnegative().optional(),
        grandTotal: z.number().nonnegative().optional(),
        subsidyData: z.array(z.object({
            uid: z.string().uuid(),
            name: z.string().min(1),
            amount: z.number().nonnegative()
        })).optional(),
        netCustomerCost: z.number().nonnegative().optional(),
        packageProducts: z.array(z.object({
            productUid: z.string().uuid(),
            quantity: z.number().positive(),
            productName: z.string().optional(),
            pricePerUnit: z.number().optional(),
            gstPercentage: z.number().optional(),
            description: z.string().optional()
        })).min(1).optional(),
        extraProducts: z.array(z.object({
            productUid: z.string().uuid(),
            quantity: z.number().positive(),
            productName: z.string().optional(),
            pricePerUnit: z.number().optional(),
            gstPercentage: z.number().optional(),
            description: z.string().optional()
        })).optional(),
        scopeOfWork: z.array(z.object({
            scopeOfWorkUid: z.string().uuid().optional(),
            title: z.string().min(1).max(255).optional(),
            value: z.string().min(1).optional(),
            sortOrder: z.number().int().min(0).optional()
        })).optional(),
        extraScopeOfWork: z.array(z.object({
            scopeOfWorkUid: z.string().uuid().optional().nullable(),
            title: z.string().min(1).max(255).optional(),
            value: z.string().min(1).optional(),
            sortOrder: z.number().int().min(0).optional()
        })).optional(),
        termsConditions: z.array(z.object({
            title: z.string().min(1).max(255),
            description: z.array(z.string().min(1)),
            sortOrder: z.number().int().min(0).optional()
        })).optional()
    })
});

export const getQuotationParamsSchema = z.object({
    params: z.object({
        uid: z.string().uuid(QUOTATION_VALIDATION_MESSAGES.INVALID_UID),
    }),
});

export const listQuotationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional().default("active"),
        leadUid: z.string().uuid().optional(),
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
            const errors = result.error.issues.map((issue: any) => ({
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
