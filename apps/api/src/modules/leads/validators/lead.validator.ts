import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createLeadSourceSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
    }),
});

export const updateLeadSourceSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
    }).strict(),
});

export const createLeadStatusSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isClosed: z.number().int().optional(),
    }),
});

export const updateLeadStatusSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isClosed: z.number().int().optional(),
    }).strict(),
});

export const createLeadSchema = z.object({
    body: z.object({
        firstName: z.string({ message: "First name is required" }).min(2, "First name must be at least 2 characters"),
        lastName: z.string({ message: "Last name is required" }).min(1, "Last name is required"),
        mobileNumber: z.string({ message: "Mobile number is required" }).min(10, "Mobile number must be at least 10 characters"),
        alternateNumber: z.string().optional(),
        email: z.string().email("Invalid email format").optional().or(z.literal("")),
        address: z.string({ message: "Address is required" }).min(1, "Address is required"),
        state: z.string({ message: "State is required" }).min(2, "State is required"),
        city: z.string({ message: "City is required" }).min(2, "City is required"),
        pinCode: z.string({ message: "Pin code is required" }).min(1, "Pin code is required"),
        monthlyBillAmount: z.number().optional(),
        systemSize: z.number({ message: "System size is required" }).min(1, "System size is required"),
        followUpDate: z.string().optional(), // accept ISO string
        leadSourceUid: z.string({ message: "Lead source is required" }).uuid("Invalid lead source UID format").optional(),
        assignedTo: z.string().uuid("Invalid user UID format").optional(),
        remarks: z.string().optional(),
    }),
});

export const updateLeadSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
        lastName: z.string().optional(),
        mobileNumber: z.string().min(10, "Mobile number must be at least 10 characters").optional(),
        alternateNumber: z.string().optional(),
        email: z.string().email("Invalid email format").optional().or(z.literal("")),
        address: z.string().optional(),
        state: z.string().min(2, "State is required").optional(),
        city: z.string().min(2, "City is required").optional(),
        pinCode: z.string().optional(),
        monthlyBillAmount: z.number().optional(),
        systemSize: z.number().optional(),
        followUpDate: z.string().optional(),
        leadSourceUid: z.string().uuid("Invalid lead source UID format").optional(),
        statusUid: z.string().uuid("Invalid lead status UID format").optional(),
        assignedTo: z.string().uuid("Invalid user UID format").optional(),
        remarks: z.string().optional(),
    }).strict(),
});

export const getByUidSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
});

export const paginationSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

export const getAllSchema = z.object({
    query: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

export const validateLeadRequest = (schema: z.ZodSchema) => {
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
