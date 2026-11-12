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

/** Helper to check if isDraft flag is truthy from various input types and query params */
function isDraftTrue(body: Record<string, unknown>, query?: Record<string, unknown>): boolean {
    const val = body.isDraft ?? body.is_draft ?? body.draft ?? body.isQuickLead ?? body.is_quick_lead
        ?? query?.isDraft ?? query?.is_draft ?? query?.draft ?? query?.isQuickLead ?? query?.is_quick_lead;
    if (val === true || val === 1 || val === "true" || val === "1") {
        return true;
    }
    if (typeof val === "string" && val.trim().toLowerCase() === "draft") {
        return true;
    }
    const statusVal = body.status ?? body.statusName ?? query?.status;
    if (typeof statusVal === "string" && statusVal.trim().toLowerCase() === "draft") {
        return true;
    }
    return false;
}

/** Base shape for lead body — all fields optional at the Zod level; required-ness enforced via superRefine */
const leadBodyBase = {
    name: z.string().optional().nullable().or(z.literal("")),
    firstName: z.string().optional().nullable().or(z.literal("")),
    lastName: z.string().optional().nullable().or(z.literal("")),
    mobileNumber: z.string().optional().nullable().or(z.literal("")),
    alternateNumber: z.string().optional().nullable().or(z.literal("")),
    email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable().or(z.literal("")),
    landmark: z.string().optional().nullable().or(z.literal("")),
    locality: z.string().optional().nullable().or(z.literal("")),
    state: z.string().optional().nullable().or(z.literal("")),
    city: z.string().optional().nullable().or(z.literal("")),
    pinCode: z.string().optional().nullable().or(z.literal("")),
    monthlyBillAmount: z.number().optional().nullable(),
    systemSize: z.number().min(0, "System size must be a positive number").optional().nullable(),
    followUpDate: z.string().optional().nullable().or(z.literal("")),
    leadSourceUid: z.string().uuid("Invalid lead source UID format").optional().nullable().or(z.literal("")),
    statusUid: z.string().uuid("Invalid lead status UID format").optional().nullable().or(z.literal("")),
    status: z.string().optional().nullable().or(z.literal("")),
    statusName: z.string().optional().nullable().or(z.literal("")),
    assignedTo: z.string().uuid("Invalid user UID format").optional().nullable().or(z.literal("")),
    remarks: z.string().optional().nullable().or(z.literal("")),
    draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    isDraft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    is_draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    isQuickLead: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    is_quick_lead: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
    category: z.coerce.number().int().min(1).max(4).optional().nullable(),
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

export const createLeadSchema = z.object({
    body: z.object(leadBodyBase),
    query: z.object({
        isDraft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        is_draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        status: z.string().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    const isDraft = isDraftTrue(data.body as Record<string, unknown>, data.query as Record<string, unknown> | undefined);
    const bodyRecord = data.body as Record<string, unknown>;
    const effectiveName = bodyRecord.firstName || bodyRecord.name;

    if (isDraft) {
        if (!effectiveName || (typeof effectiveName === "string" && effectiveName.trim().length < 2)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "First name is required (min 2 characters)",
                path: ["body", "firstName"],
            });
        }
    } else {
        if (!effectiveName || (typeof effectiveName === "string" && effectiveName.trim().length < 2)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "First name is required",
                path: ["body", "firstName"],
            });
        }
        for (const { key, label } of CREATE_REQUIRED_FIELDS) {
            if (key === "firstName") continue;
            const value = bodyRecord[key];
            if (value === undefined || value === null || value === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: label,
                    path: ["body", key],
                });
            }
        }
    }
});

export const updateLeadSchema = z.object({
    params: z.object({
        uid: z.string().uuid("Invalid UID format"),
    }),
    body: z.object(leadBodyBase),
    query: z.object({
        isDraft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        is_draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        draft: z.union([z.boolean(), z.number().int(), z.string()]).optional(),
        status: z.string().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    const isDraft = isDraftTrue(data.body as Record<string, unknown>, data.query as Record<string, unknown> | undefined);
    const bodyRecord = data.body as Record<string, unknown>;
    const effectiveName = bodyRecord.firstName || bodyRecord.name;

    // For updates: if isDraft is true, only name is required
    if (isDraft) {
        if (!effectiveName || (typeof effectiveName === "string" && effectiveName.trim().length < 2)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "First name is required (min 2 characters)",
                path: ["body", "firstName"],
            });
        }
    }
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
                // Normalize name -> firstName if firstName missing
                if (!parsed.body.firstName && parsed.body.name) {
                    parsed.body.firstName = parsed.body.name;
                }
                // Normalize isDraft flag if detected from query or status
                if (isDraftTrue(parsed.body, req.query as Record<string, unknown>)) {
                    parsed.body.isDraft = true;
                }
                req.body = parsed.body;
            }
            if (parsed && typeof parsed === "object" && parsed.query !== undefined) {
                try {
                    req.query = parsed.query;
                } catch {
                    Object.defineProperty(req, "query", {
                        value: parsed.query,
                        writable: true,
                        configurable: true,
                        enumerable: true,
                    });
                }
            }
            if (parsed && typeof parsed === "object" && parsed.params !== undefined) {
                try {
                    req.params = parsed.params;
                } catch {
                    Object.defineProperty(req, "params", {
                        value: parsed.params,
                        writable: true,
                        configurable: true,
                        enumerable: true,
                    });
                }
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


export const cursorPaginationSchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(50).optional().default(5),
        cursor: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional().default("active"),
        statusUid: z.string().uuid("Invalid status UID format").optional(),
        assignedTo: z.string().uuid("Invalid user UID format").optional(),
        leadSourceUid: z.string().uuid("Invalid lead source UID format").optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        followUpDate: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        minCapacity: z.coerce.number().min(0).optional(),
        maxCapacity: z.coerce.number().min(0).optional(),
        sortBy: z.enum(["created_at", "updated_at", "first_name", "system_size"]).optional().default("created_at"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    }),
});
