import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import {
  MASTER_DOCUMENT_MESSAGES,
  MASTER_DOCUMENT_VALIDATION_MESSAGES,
  VALID_ENTITY_TYPES,
  VALID_MODULES,
  VALID_CATEGORIES,
} from "../constants/master-documents.constants.js";

// ============================================================
// Document Type Validators
// ============================================================

export const createDocumentTypeSchema = z.object({
  body: z
    .object({
      name: z
        .string({ message: MASTER_DOCUMENT_VALIDATION_MESSAGES.NAME_REQUIRED })
        .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.NAME_REQUIRED),
      category: z
        .number()
        .int()
        .refine((val) => VALID_CATEGORIES.includes(val as any), {
          message: MASTER_DOCUMENT_VALIDATION_MESSAGES.CATEGORY_INVALID,
        })
        .optional(),
      description: z.string().optional(),
      allowedExtensions: z.string().optional(),
      allowMultiple: z.number().int().min(0).max(1).optional(),
      isRequired: z.number().int().min(0).max(1).optional(),
      applicableModules: z.array(z.enum(VALID_MODULES)).optional(),
      sortOrder: z.number().int().optional(),
      isCommonForAllModules: z.number().int().min(0).max(1).optional(),
    })
    .strict(),
});

export const updateDocumentTypeSchema = z.object({
  params: z.object({
    uid: z.string().uuid(MASTER_DOCUMENT_VALIDATION_MESSAGES.UID_INVALID),
  }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      category: z
        .number()
        .int()
        .refine((val) => VALID_CATEGORIES.includes(val as any), {
          message: MASTER_DOCUMENT_VALIDATION_MESSAGES.CATEGORY_INVALID,
        })
        .optional(),
      description: z.string().optional(),
      allowedExtensions: z.string().optional(),
      allowMultiple: z.number().int().min(0).max(1).optional(),
      isRequired: z.number().int().min(0).max(1).optional(),
      applicableModules: z.array(z.enum(VALID_MODULES)).optional(),
      sortOrder: z.number().int().optional(),
      isCommonForAllModules: z.number().int().min(0).max(1).optional(),
      isActive: z.number().int().min(0).max(1).optional(),
    })
    .strict(),
});

// ============================================================
// Document Validators
// ============================================================

export const uploadDocumentSchema = z.object({
  body: z.object({
    documentTypeUid: z
      .string()
      .uuid(MASTER_DOCUMENT_VALIDATION_MESSAGES.DOC_TYPE_UID_REQUIRED),
    entityType: z.enum(VALID_ENTITY_TYPES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_TYPE_INVALID,
    }),
    entityUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_UID_REQUIRED),
    module: z.enum(VALID_MODULES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
    }),
    contextUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.CONTEXT_UID_REQUIRED),
    documentNumber: z.string().optional(),
    remarks: z.string().optional(),
  }),
});

export const linkDocumentSchema = z.object({
  body: z
    .object({
      masterDocumentUid: z
        .string()
        .uuid(MASTER_DOCUMENT_VALIDATION_MESSAGES.MASTER_DOC_UID_REQUIRED),
      module: z.enum(VALID_MODULES, {
        message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
      }),
      contextUid: z
        .string()
        .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.CONTEXT_UID_REQUIRED),
      remarks: z.string().optional(),
    })
    .strict(),
});

export const getByEntitySchema = z.object({
  params: z.object({
    entityType: z.enum(VALID_ENTITY_TYPES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_TYPE_INVALID,
    }),
    entityUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_UID_REQUIRED),
  }),
});

export const getByContextSchema = z.object({
  params: z.object({
    module: z.enum(VALID_MODULES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
    }),
    contextUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.CONTEXT_UID_REQUIRED),
  }),
});

export const getAvailableSchema = z.object({
  params: z.object({
    module: z.enum(VALID_MODULES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
    }),
    contextUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.CONTEXT_UID_REQUIRED),
  }),
  query: z.object({
    entityType: z.enum(VALID_ENTITY_TYPES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_TYPE_INVALID,
    }),
    entityUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.ENTITY_UID_REQUIRED),
  }),
});

// ============================================================
// Common Validators
// ============================================================

export const uidParamSchema = z.object({
  params: z.object({
    uid: z.string().uuid(MASTER_DOCUMENT_VALIDATION_MESSAGES.UID_INVALID),
  }),
});

export const moduleParamSchema = z.object({
  params: z.object({
    module: z.enum(VALID_MODULES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
    }),
  }),
});

export const getByModuleAndContextSchema = z.object({
  params: z.object({
    module: z.enum(VALID_MODULES, {
      message: MASTER_DOCUMENT_VALIDATION_MESSAGES.MODULE_INVALID,
    }),
    contextUid: z
      .string()
      .min(1, MASTER_DOCUMENT_VALIDATION_MESSAGES.CONTEXT_UID_REQUIRED),
  }),
});

export const paginationSchema = z.object({
  body: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).optional(),
    search: z.string().optional(),
    status: z
      .union([z.literal("active"), z.literal("deleted"), z.literal("all")])
      .optional(),
    module: z.enum(VALID_MODULES).optional(),
    contextUid: z.string().optional(),
    entityType: z.enum(VALID_ENTITY_TYPES).optional(),
    entityUid: z.string().optional(),
    category: z
      .number()
      .int()
      .refine((val) => VALID_CATEGORIES.includes(val as any))
      .optional(),
  }),
});

// ============================================================
// Validation Middleware Factory
// ============================================================

export function validateMasterDocumentRequest(schema: z.ZodTypeAny) {
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
        message: MASTER_DOCUMENT_MESSAGES.VALIDATION_FAILED,
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
