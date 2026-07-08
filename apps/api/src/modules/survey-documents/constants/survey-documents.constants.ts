export const SURVEY_DOCUMENT_TYPE_MESSAGES = {
    CREATED: "Survey document type created successfully",
    FETCHED: "Survey document types fetched successfully",
    UPDATED: "Survey document type updated successfully",
    DELETED: "Survey document type deleted successfully",
    RESTORED: "Survey document type restored successfully",
    NOT_FOUND: "Survey document type not found",
    CREATION_FAILED: "Failed to create survey document type",
    UPDATE_FAILED: "Failed to update survey document type",
    DELETE_FAILED: "Failed to delete survey document type",
    CANNOT_DELETE_SYSTEM_TYPE: "Cannot delete a default system document type",
    VALIDATION_FAILED: "Validation failed",
};

export const SURVEY_DOCUMENT_MESSAGES = {
    UPLOADED: "Survey document uploaded successfully",
    FETCHED: "Survey documents fetched successfully",
    DELETED: "Survey document deleted successfully",
    NOT_FOUND: "Survey document not found",
    UPLOAD_FAILED: "Failed to upload survey document",
    DELETE_FAILED: "Failed to delete survey document",
    SURVEY_NOT_FOUND: "Site survey not found",
    MULTIPLE_NOT_ALLOWED: "Multiple documents are not allowed for this document type",
    VALIDATION_FAILED: "Validation failed",
};

export const SURVEY_DOCUMENT_VALIDATION_MESSAGES = {
    UID_INVALID: "Invalid UID format",
    TENANT_UID_REQUIRED: "Tenant UID is required",
    TENANT_UID_INVALID: "Invalid Tenant UID format",
    SURVEY_UID_REQUIRED: "Site survey UID is required",
    SURVEY_UID_INVALID: "Invalid site survey UID format",
    DOC_TYPE_UID_REQUIRED: "Document type UID is required",
    DOC_TYPE_UID_INVALID: "Invalid document type UID format",
    NAME_REQUIRED: "Name is required",
    NAME_INVALID: "Name must be a string",
    IS_REQUIRED_INVALID: "is_required must be 0 or 1",
    ALLOW_MULTIPLE_INVALID: "allow_multiple must be 0 or 1",
    SORT_ORDER_INVALID: "sort_order must be an integer",
};
