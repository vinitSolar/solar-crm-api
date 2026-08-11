// ============================================================
// Master Document Type Messages
// ============================================================
export const MASTER_DOCUMENT_TYPE_MESSAGES = {
  CREATED: "Document type created successfully",
  UPDATED: "Document type updated successfully",
  DELETED: "Document type deleted successfully",
  RESTORED: "Document type restored successfully",
  FETCHED: "Document type fetched successfully",
  FETCHED_ALL: "Document types fetched successfully",
  NOT_FOUND: "Document type not found",
  NAME_EXISTS: "A document type with this name already exists",
  SYSTEM_DELETE: "System document types cannot be deleted",
  VALIDATION_FAILED: "Validation failed",
} as const;

// ============================================================
// Master Document Messages
// ============================================================
export const MASTER_DOCUMENT_MESSAGES = {
  UPLOADED: "Document uploaded successfully",
  LINKED: "Document linked successfully",
  UNLINKED: "Document unlinked successfully",
  DELETED: "Document deleted successfully",
  FETCHED: "Documents fetched successfully",
  NOT_FOUND: "Document not found",
  UPLOAD_FAILED: "Failed to upload document",
  ALREADY_LINKED: "Document is already linked to this context",
  NO_FILE: "No file provided",
  INVALID_ENTITY_TYPE: "Invalid entity type",
  INVALID_MODULE: "Invalid module",
  ASSOCIATION_NOT_FOUND: "Document association not found",
  VALIDATION_FAILED: "Validation failed",
} as const;

// ============================================================
// Validation Messages
// ============================================================
export const MASTER_DOCUMENT_VALIDATION_MESSAGES = {
  UID_INVALID: "Invalid UID format",
  NAME_REQUIRED: "Name is required",
  CATEGORY_INVALID:
    "Invalid category. Must be one of: 1 (identity), 2 (address), 3 (financial), 4 (technical), 5 (general)",
  ENTITY_TYPE_INVALID:
    "Invalid entity type. Must be one of: customer, lead, franchise, product",
  MODULE_INVALID:
    "Invalid module. Must be one of: site_survey, subsidy_tracker, project, franchise, product",
  DOC_TYPE_UID_REQUIRED: "Document type UID is required",
  ENTITY_UID_REQUIRED: "Entity UID is required",
  CONTEXT_UID_REQUIRED: "Context UID is required",
  MASTER_DOC_UID_REQUIRED: "Master document UID is required",
} as const;

// ============================================================
// Valid Enums
// ============================================================
export const VALID_ENTITY_TYPES = [
  "customer",
  "lead",
  "franchise",
  "product",
] as const;

export const VALID_MODULES = [
  "site_survey",
  "subsidy_tracker",
  "project",
  "franchise",
  "product",
] as const;

export const VALID_CATEGORIES = [1, 2, 3, 4, 5] as const;
