import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const createLeadSourceSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isActive: z.number().int().min(0).max(1).optional(),
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
        isActive: z.number().int().min(0).max(1).optional(),
    }).strict(),
});

export const createLeadStatusSchema = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
        color: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isDefault: z.number().int().optional(),
        isClosed: z.number().int().optional(),
        isDraft: z.union([z.number().int(), z.boolean()]).optional().transform((v) => typeof v === "boolean" ? (v ? 1 : 0) : v),
        isActive: z.number().int().min(0).max(1).optional(),
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
        isDraft: z.union([z.number().int(), z.boolean()]).optional().transform((v) => typeof v === "boolean" ? (v ? 1 : 0) : v),
        isActive: z.number().int().min(0).max(1).optional(),
    }).strict(),
});

/** Helper to check if isDraft flag is truthy from various input types */
function isDraftTrue(data: Record<string, unknown>): boolean {
    const val = data.isDraft ?? data.is_draft;
    return val === true || val === 1 || val === "true" || val === "1";
}

/** Base shape for lead body — all fields optional at the Zod level; required-ness enforced via superRefine */
const leadBodyBase = {
    firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    mobileNumber: z.string().min(10, "Mobile number must be at least 10 characters").optional(),
    alternateNumber: z.string().optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    address: z.string().min(1, "Address is required").optional(),
    landmark: z.string().optional(),
    state: z.string().min(2, "State is required").optional(),
    city: z.string().min(2, "City is required").optional(),
    pinCode: z.string().min(1, "Pin code is required").optional(),
    monthlyBillAmount: z.number().optional(),
    systemSize: z.number().min(0, "System size must be a positive number").optional(),
    followUpDate: z.string().optional(),
    leadSourceUid: z.string().uuid("Invalid lead source UID format").optional(),
    statusUid: z.string().uuid("Invalid lead status UID format").optional(),
    assignedTo: z.string().uuid("Invalid user UID format").optional().nullable().or(z.literal("")),
    remarks: z.string().optional(),
    isDraft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    is_draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
};

/** Fields that are required when isDraft is false (normal lead creation) */
const CREATE_REQUIRED_FIELDS: { key: string; label: string }[] = [
    { key: "firstName", label: "First name is required" },
    { key: "lastName", label: "Last name is required" },
    { key: "mobileNumber", label: "Mobile number is required" },
    { key: "address", label: "Address is required" },
    { key: "state", label: "State is required" },
    { key: "city", label: "City is required" },
    { key: "pinCode", label: "Pin code is required" },
    { key: "systemSize", label: "System size is required" },
];

/** Fields that are required when isDraft is true (only name) */
const DRAFT_REQUIRED_FIELDS: { key: string; label: string }[] = [
    { key: "firstName", label: "First name is required" },
];

export const createLeadSchema = z.object({
    body: z.object(leadBodyBase).superRefine((data, ctx) => {
        const requiredFields = isDraftTrue(data) ? DRAFT_REQUIRED_FIELDS : CREATE_REQUIRED_FIELDS;
        for (const { key, label } of requiredFields) {
            const value = (data as Record<string, unknown>)[key];
            if (value === undefined || value === null || value === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: label,
                    path: [key],
                });
            }
        }
    }),
});

export const updateLeadSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object(leadBodyBase).superRefine((data, ctx) => {
        // For updates: if isDraft is explicitly true, only firstName is required
        if (isDraftTrue(data)) {
            for (const { key, label } of DRAFT_REQUIRED_FIELDS) {
                const value = (data as Record<string, unknown>)[key];
                if (value === undefined || value === null || value === "") {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: label,
                        path: [key],
                    });
                }
            }
        }
        // When isDraft is false/absent in updates, all fields remain optional (partial update)
    }),
});

export const changeLeadStatusSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object({
        statusUid: z.string({ message: "Status UID is required" }).uuid("Invalid lead status UID format"),
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
        assignedTo: z.string().uuid("Invalid user UID format").optional(),
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
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }) as any;
            if (parsed && typeof parsed === "object" && parsed.body !== undefined) {
                req.body = parsed.body;
            }
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
