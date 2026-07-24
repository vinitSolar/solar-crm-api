import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const updateSubsidyTrackerSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        portalStatus: z.number().int().min(0).max(8).optional(),
        netMeterStatus: z.number().int().min(0).max(6).optional(),
        portalReferenceNumber: z.string().optional().nullable(),
        discomReferenceNumber: z.string().optional().nullable(),
        approvedSubsidyAmount: z.number().optional().nullable(),
        receivedSubsidyAmount: z.number().optional().nullable(),
        approvedDate: z.string().optional().nullable(),
        disbursedDate: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
        search: z.string().optional(),
        portalStatus: z.number().int().optional(),
        netMeterStatus: z.number().int().optional(),
        subsidyUid: z.string().uuid().optional(),
    }),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
});

export function validateSubsidyTrackerRequest(schema: z.ZodSchema<any>) {
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
                errors: result.error.issues.map((e: z.ZodIssue) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
            return;
        }

        if (result.data.body) req.body = result.data.body;
        if (result.data.query) req.query = result.data.query;
        if (result.data.params) req.params = result.data.params;

        next();
    };
}
