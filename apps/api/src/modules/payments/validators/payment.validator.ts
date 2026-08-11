import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createPaymentSchema = z.object({
    body: z.object({
        leadUid: z.string({ message: "Lead UID is required" }).uuid("Invalid Lead UID format"),
        amount: z.number({ message: "Amount is required" }).min(0, "Amount must be a positive number"),
        paymentMethod: z.number({ message: "Payment method is required" }).int().min(0).max(6),
        transactionReference: z.string().optional(),
        paymentDate: z.string({ message: "Payment date is required" }), // Accept ISO string
        status: z.number().int().min(0).max(4).optional(),
        notes: z.string().optional(),
    }),
});

export const updatePaymentSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        amount: z.number().min(0, "Amount must be a positive number").optional(),
        paymentMethod: z.number().int().min(0).max(6).optional(),
        transactionReference: z.string().optional(),
        paymentDate: z.string().optional(),
        status: z.number().int().min(0).max(4).optional(),
        notes: z.string().optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
});

export const getByLeadUidSchema = z.object({
    params: z.object({
        leadUid: z.string().uuid("Invalid Lead UID format"),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
        leadUid: z.string().uuid("Invalid Lead UID format").optional(), // specific filter for lead
    }),
});

export const validatePaymentRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
                    message: "Validation failed",
                    errors: error.issues.map((err) => ({
                        field: err.path.join("."),
                        message: err.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};
