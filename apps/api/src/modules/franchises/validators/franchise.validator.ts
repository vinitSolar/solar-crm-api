import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { FRANCHISE_MESSAGES } from "../constants/franchise.constants.js";

/**
 * GST Number format: 2-digit state code + 10-char PAN + 1 digit + Z + 1 alphanumeric
 * Example: 22AAAAA0000A1Z5
 */
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * PAN Number format: 5 uppercase letters + 4 digits + 1 uppercase letter
 * Example: ABCDE1234F
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ─── Create ──────────────────────────────────────────────────────────

export const createFranchiseSchema = z.object({
    body: z.object({
        franchise: z.object({
            name: z.string()
                .min(2, FRANCHISE_MESSAGES.INVALID_NAME)
                .max(255, FRANCHISE_MESSAGES.INVALID_NAME),
            code: z.string()
                .min(2, FRANCHISE_MESSAGES.INVALID_CODE)
                .max(100, FRANCHISE_MESSAGES.INVALID_CODE),
            email: z.string().email(FRANCHISE_MESSAGES.INVALID_EMAIL).optional(),
            mobile: z.string().max(20, FRANCHISE_MESSAGES.INVALID_MOBILE).optional(),
            logo: z.string().max(500).optional(),
        }),
        owner: z.object({
            fullName: z.string()
                .min(2, FRANCHISE_MESSAGES.OWNER_FULL_NAME_REQUIRED)
                .max(255, FRANCHISE_MESSAGES.OWNER_FULL_NAME_REQUIRED),
            dateOfBirth: z.string().optional(),
            profilePhoto: z.string().max(500).optional(),
            mobileNumber: z.string()
                .min(1, FRANCHISE_MESSAGES.OWNER_MOBILE_REQUIRED)
                .max(20),
            alternateNumber: z.string().max(20).optional(),
            email: z.string().email(FRANCHISE_MESSAGES.INVALID_EMAIL).optional(),
            residentialAddress: z.string().optional(),
        }),
        business: z.object({
            businessName: z.string()
                .min(2, FRANCHISE_MESSAGES.BUSINESS_NAME_REQUIRED)
                .max(255, FRANCHISE_MESSAGES.BUSINESS_NAME_REQUIRED),
            gstNumber: z.string()
                .min(1, FRANCHISE_MESSAGES.GST_NUMBER_REQUIRED)
                .regex(GST_REGEX, FRANCHISE_MESSAGES.GST_NUMBER_INVALID),
            panNumber: z.string()
                .min(1, FRANCHISE_MESSAGES.PAN_NUMBER_REQUIRED)
                .regex(PAN_REGEX, FRANCHISE_MESSAGES.PAN_NUMBER_INVALID),
            cinNumber: z.string().max(25).optional(),
            msmeRegistrationNumber: z.string().max(50).optional(),
            tradeLicenseNumber: z.string().max(50).optional(),
            businessAddress: z.string().optional(),
            city: z.string().max(100).optional(),
            state: z.string().max(100).optional(),
            pinCode: z.string().max(10).optional(),
        }),
    }),
});

// ─── Update ──────────────────────────────────────────────────────────

export const updateFranchiseSchema = z.object({
    params: z.object({
        uid: z.string().uuid(FRANCHISE_MESSAGES.INVALID_UID),
    }),
    body: z.object({
        franchise: z.object({
            name: z.string().min(2, FRANCHISE_MESSAGES.INVALID_NAME).max(255, FRANCHISE_MESSAGES.INVALID_NAME).optional(),
            email: z.string().email(FRANCHISE_MESSAGES.INVALID_EMAIL).optional(),
            mobile: z.string().max(20, FRANCHISE_MESSAGES.INVALID_MOBILE).optional(),
            logo: z.string().max(500).optional(),
        }).optional(),
        owner: z.object({
            fullName: z.string().min(2, FRANCHISE_MESSAGES.OWNER_FULL_NAME_REQUIRED).max(255).optional(),
            dateOfBirth: z.string().optional(),
            profilePhoto: z.string().max(500).optional(),
            mobileNumber: z.string().max(20).optional(),
            alternateNumber: z.string().max(20).optional(),
            email: z.string().email(FRANCHISE_MESSAGES.INVALID_EMAIL).optional(),
            residentialAddress: z.string().optional(),
        }).optional(),
        business: z.object({
            businessName: z.string().min(2, FRANCHISE_MESSAGES.BUSINESS_NAME_REQUIRED).max(255).optional(),
            gstNumber: z.string().regex(GST_REGEX, FRANCHISE_MESSAGES.GST_NUMBER_INVALID).optional(),
            panNumber: z.string().regex(PAN_REGEX, FRANCHISE_MESSAGES.PAN_NUMBER_INVALID).optional(),
            cinNumber: z.string().max(25).optional(),
            msmeRegistrationNumber: z.string().max(50).optional(),
            tradeLicenseNumber: z.string().max(50).optional(),
            businessAddress: z.string().optional(),
            city: z.string().max(100).optional(),
            state: z.string().max(100).optional(),
            pinCode: z.string().max(10).optional(),
        }).optional(),
    }).refine(data => data.franchise || data.owner || data.business, {
        message: FRANCHISE_MESSAGES.UPDATE_NO_FIELDS,
    }),
});

// ─── Get / Delete / Restore ─────────────────────────────────────────

export const getFranchiseSchema = z.object({
    params: z.object({
        uid: z.string().uuid(FRANCHISE_MESSAGES.INVALID_UID),
    }),
});

export const deleteFranchiseSchema = z.object({
    params: z.object({
        uid: z.string().uuid(FRANCHISE_MESSAGES.INVALID_UID),
    }),
});

export const restoreFranchiseSchema = z.object({
    params: z.object({
        uid: z.string().uuid(FRANCHISE_MESSAGES.INVALID_UID),
    }),
});

// ─── List / All ─────────────────────────────────────────────────────

export const getPaginatedFranchisesSchema = z.object({
    body: z.object({
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        search: z.string().optional(),
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

export const getAllFranchisesSchema = z.object({
    query: z.object({
        status: z.enum(["active", "deleted", "all"]).optional(),
    }),
});

// ─── Validator Middleware ────────────────────────────────────────────

/**
 * Generic request validator for franchise endpoints.
 * Follows the same pattern as validateUserRequest in the users module.
 */
export function validateFranchiseRequest(schema: z.ZodTypeAny) {
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
                message: FRANCHISE_MESSAGES.VALIDATION_ERROR,
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
