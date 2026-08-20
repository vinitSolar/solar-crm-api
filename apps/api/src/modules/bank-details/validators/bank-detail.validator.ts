import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createBankDetailSchema = z.object({
    body: z.object({
        accountName: z.string().min(1, "Account name is required").max(255),
        accountNumber: z.string().min(1, "Account number is required").max(100),
        ifscCode: z.string().min(1, "IFSC code is required").max(50),
        bankName: z.string().min(1, "Bank name is required").max(255),
        branchName: z.string().min(1, "Branch name is required").max(255),
        swiftCode: z.string().max(50).optional(),
        upiId: z.string().max(100).optional(),
    }),
});

export const updateBankDetailSchema = z.object({
    body: z.object({
        accountName: z.string().min(1, "Account name is required").max(255).optional(),
        accountNumber: z.string().min(1, "Account number is required").max(100).optional(),
        ifscCode: z.string().min(1, "IFSC code is required").max(50).optional(),
        bankName: z.string().min(1, "Bank name is required").max(255).optional(),
        branchName: z.string().min(1, "Branch name is required").max(255).optional(),
        swiftCode: z.string().max(50).optional(),
        upiId: z.string().max(100).optional(),
    }),
});

export const validateBankDetailRequest = (schema: z.ZodTypeAny) => 
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const zodError = error as any;
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: zodError.errors ? zodError.errors.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message
                    })) : zodError.issues.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            } else {
                next(error);
            }
        }
    };
