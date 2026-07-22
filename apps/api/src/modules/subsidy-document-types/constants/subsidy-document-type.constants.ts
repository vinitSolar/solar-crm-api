export const SUBSIDY_DOCUMENT_TYPE_MESSAGES = {
    CREATED: "Subsidy document type created successfully",
    UPDATED: "Subsidy document type updated successfully",
    DELETED: "Subsidy document type deleted successfully",
    RESTORED: "Subsidy document type restored successfully",
    FETCHED: "Subsidy document type fetched successfully",
    NOT_FOUND: "Subsidy document type not found",
    NAME_ALREADY_EXISTS: "A subsidy document type with this name already exists",
    NAME_REQUIRED: "Document type name is required",
    INVALID_UID: "Invalid document type UID provided",
    RESTORE_FAILED: "Subsidy document type restore failed",
    DELETE_FAILED: "Subsidy document type delete failed",
    HEAD_OFFICE_ONLY: "Only Head Office administrators can perform this action",
    AT_LEAST_ONE_DOCUMENT_REQUIRED: "At least one required document must be selected",
    INVALID_DOCUMENT_TYPES: "One or more document type UIDs are invalid or inactive",
    DUPLICATE_DOCUMENT_TYPES: "Duplicate document type UIDs are not allowed in the selection",
};

export const SUBSIDY_DOCUMENT_TYPE_AUDIT = {
    MODULE: "SubsidyDocumentType",
    ACTIONS: {
        CREATE: "Document Type Created",
        UPDATE: "Document Type Updated",
        DELETE: "Document Type Deleted",
        RESTORE: "Document Type Restored",
    },
};
