import type { Request, Response, NextFunction } from "express";
import { z, type ZodTypeAny } from "zod";

export function validateRequest(schema: ZodTypeAny) {
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
